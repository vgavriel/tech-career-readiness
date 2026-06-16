import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getEslintDependencyLocation,
  getLatestEslintVersionFromNpm,
  npmView,
  parseMajor,
  prepareEslintMajorUpgrade,
  removeEslintMajorBlockers,
  runPrepareEslintMajorUpgrade,
} from "../prepare-eslint-major-upgrade.mjs";

const BLOCKER_DESCRIPTION =
  "ESLint 10 is blocked until eslint-config-next's plugin stack supports it.";

const tmpDirs = [];

afterEach(async () => {
  await Promise.all(
    tmpDirs.splice(0).map((tmpDir) =>
      rm(tmpDir, {
        force: true,
        recursive: true,
      })
    )
  );
});

async function createTempRepo(files) {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "eslint-major-test-"));
  tmpDirs.push(tmpDir);

  await Promise.all(
    Object.entries(files).map(([fileName, contents]) =>
      writeFile(
        path.join(tmpDir, fileName),
        typeof contents === "string" ? contents : `${JSON.stringify(contents, null, 2)}\n`
      )
    )
  );

  return tmpDir;
}

function packageJson(overrides = {}) {
  return {
    name: "tmp-next",
    private: true,
    devDependencies: {
      eslint: "^9",
      "eslint-config-next": "^16.1.2",
    },
    ...overrides,
  };
}

function packageLock(version = "9.39.4") {
  return {
    lockfileVersion: 3,
    packages: {
      "": {
        devDependencies: {
          eslint: "^9",
        },
      },
      "node_modules/eslint": {
        version,
      },
    },
  };
}

function renovateJson(packageRules = []) {
  return {
    $schema: "https://docs.renovatebot.com/renovate-schema.json",
    packageRules,
  };
}

describe("parseMajor", () => {
  it("extracts the first numeric major from common version strings", () => {
    expect(parseMajor("10.5.0")).toBe(10);
    expect(parseMajor("^9")).toBe(9);
    expect(parseMajor(">=8.57.0 || ^9.0.0")).toBe(8);
  });

  it("returns NaN for values without a numeric segment", () => {
    expect(Number.isNaN(parseMajor("latest"))).toBe(true);
    expect(Number.isNaN(parseMajor(undefined))).toBe(true);
  });
});

describe("getEslintDependencyLocation", () => {
  it("prefers devDependencies when eslint appears in both dependency sections", () => {
    expect(
      getEslintDependencyLocation({
        dependencies: { eslint: "^8" },
        devDependencies: { eslint: "^9" },
      })
    ).toBe("devDependencies");
  });

  it("falls back to dependencies when eslint is not a dev dependency", () => {
    expect(
      getEslintDependencyLocation({
        dependencies: { eslint: "^9" },
      })
    ).toBe("dependencies");
  });

  it("returns null when package.json does not declare eslint", () => {
    expect(getEslintDependencyLocation({ devDependencies: {} })).toBeNull();
  });
});

describe("npm metadata helpers", () => {
  it("reads package metadata through npm view with JSON output", () => {
    const execFile = vi.fn(() => "10.5.0\n");

    expect(npmView("eslint", "version", execFile)).toBe("10.5.0");
    expect(execFile).toHaveBeenCalledWith("npm", ["view", "eslint", "version", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    });
  });

  it("parses the latest ESLint version from npm JSON output", () => {
    expect(getLatestEslintVersionFromNpm(() => '"10.5.0"')).toBe("10.5.0");
  });
});

describe("removeEslintMajorBlockers", () => {
  it("removes only eslint rules that match the known major blocker", () => {
    const rules = [
      {
        matchManagers: ["npm"],
        postUpdateOptions: ["npmInstallTwice"],
      },
      {
        description: BLOCKER_DESCRIPTION,
        matchPackageNames: ["eslint"],
        allowedVersions: "<10.0.0",
      },
      {
        matchPackageNames: ["eslint"],
        dependencyDashboardApproval: true,
      },
      {
        matchPackageNames: ["next"],
        allowedVersions: "<17.0.0",
      },
    ];

    expect(removeEslintMajorBlockers(rules)).toEqual([rules[0], rules[2], rules[3]]);
  });

  it("leaves non-array packageRules unchanged", () => {
    expect(removeEslintMajorBlockers(undefined)).toBeUndefined();
  });
});

describe("prepareEslintMajorUpgrade", () => {
  it("returns a no-op result when the latest ESLint major is already installed", () => {
    const result = prepareEslintMajorUpgrade({
      packageJson: packageJson(),
      packageLock: packageLock("9.39.4"),
      renovateJson: renovateJson(),
      targetVersion: "9.99.0",
    });

    expect(result).toMatchObject({
      currentMajor: 9,
      currentVersion: "9.39.4",
      targetMajor: 9,
      targetVersion: "9.99.0",
      upgradeNeeded: false,
    });
    expect(result.targetRange).toBeUndefined();
  });

  it("updates the eslint dev dependency and removes the Renovate blocker for a newer major", () => {
    const originalPackageJson = packageJson();
    const originalRenovateJson = renovateJson([
      {
        matchManagers: ["npm"],
        postUpdateOptions: ["npmInstallTwice"],
      },
      {
        description: BLOCKER_DESCRIPTION,
        matchManagers: ["npm"],
        matchPackageNames: ["eslint"],
        allowedVersions: "<10.0.0",
      },
      {
        matchPackageNames: ["eslint"],
        dependencyDashboardApproval: true,
      },
    ]);

    const result = prepareEslintMajorUpgrade({
      packageJson: originalPackageJson,
      packageLock: packageLock("9.39.4"),
      renovateJson: originalRenovateJson,
      targetVersion: "10.5.0",
    });

    expect(result).toMatchObject({
      currentMajor: 9,
      currentVersion: "9.39.4",
      targetMajor: 10,
      targetRange: "^10.0.0",
      targetVersion: "10.5.0",
      upgradeNeeded: true,
    });
    expect(result.packageJson.devDependencies.eslint).toBe("^10.0.0");
    expect(result.renovateJson.packageRules).toEqual([
      originalRenovateJson.packageRules[0],
      originalRenovateJson.packageRules[2],
    ]);
    expect(originalPackageJson.devDependencies.eslint).toBe("^9");
    expect(originalRenovateJson.packageRules).toHaveLength(3);
  });

  it("updates eslint in dependencies when it is not a dev dependency", () => {
    const result = prepareEslintMajorUpgrade({
      packageJson: packageJson({
        dependencies: {
          eslint: "^9",
        },
        devDependencies: {
          "eslint-config-next": "^16.1.2",
        },
      }),
      packageLock: packageLock("9.39.4"),
      renovateJson: renovateJson(),
      targetVersion: "10.1.0",
    });

    expect(result.packageJson.dependencies.eslint).toBe("^10.0.0");
  });

  it("uses the package range when the lockfile has no eslint entry", () => {
    const result = prepareEslintMajorUpgrade({
      packageJson: packageJson(),
      packageLock: {
        packages: {},
      },
      renovateJson: renovateJson(),
      targetVersion: "10.0.1",
    });

    expect(result.currentVersion).toBe("^9");
    expect(result.upgradeNeeded).toBe(true);
  });

  it("throws when package.json does not declare eslint", () => {
    expect(() =>
      prepareEslintMajorUpgrade({
        packageJson: packageJson({
          devDependencies: {
            "eslint-config-next": "^16.1.2",
          },
        }),
        packageLock: packageLock("9.39.4"),
        renovateJson: renovateJson(),
        targetVersion: "10.5.0",
      })
    ).toThrow("Unable to find eslint");
  });

  it("throws when current or target versions cannot be compared", () => {
    expect(() =>
      prepareEslintMajorUpgrade({
        packageJson: packageJson({
          devDependencies: {
            eslint: "latest",
          },
        }),
        packageLock: {
          packages: {},
        },
        renovateJson: renovateJson(),
        targetVersion: "next",
      })
    ).toThrow("Unable to compare ESLint versions");
  });
});

describe("runPrepareEslintMajorUpgrade", () => {
  it("writes package and Renovate changes plus GitHub outputs for a compatible trial target", async () => {
    const cwd = await createTempRepo({
      "package.json": packageJson(),
      "package-lock.json": packageLock("9.39.4"),
      "renovate.json": renovateJson([
        {
          matchManagers: ["npm"],
          postUpdateOptions: ["npmInstallTwice"],
        },
        {
          description: BLOCKER_DESCRIPTION,
          matchPackageNames: ["eslint"],
          allowedVersions: "<10.0.0",
        },
      ]),
      "github-output.txt": "",
    });
    const logger = {
      log: vi.fn(),
    };

    const result = await runPrepareEslintMajorUpgrade({
      cwd,
      env: {},
      getLatestEslintVersion: () => "10.5.0",
      logger,
      outputPath: path.join(cwd, "github-output.txt"),
    });

    const nextPackageJson = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"));
    const nextRenovateJson = JSON.parse(await readFile(path.join(cwd, "renovate.json"), "utf8"));
    const output = await readFile(path.join(cwd, "github-output.txt"), "utf8");

    expect(result.upgradeNeeded).toBe(true);
    expect(nextPackageJson.devDependencies.eslint).toBe("^10.0.0");
    expect(nextRenovateJson.packageRules).toEqual([
      {
        matchManagers: ["npm"],
        postUpdateOptions: ["npmInstallTwice"],
      },
    ]);
    expect(output).toContain("upgrade_needed=true");
    expect(output).toContain("target_range=^10.0.0");
    expect(logger.log).toHaveBeenCalledWith(
      "Prepared ESLint major upgrade from 9.39.4 to ^10.0.0 (10.5.0)."
    );
  });

  it("does not rewrite files when no newer major is available", async () => {
    const initialPackageJson = packageJson();
    const initialRenovateJson = renovateJson([
      {
        description: BLOCKER_DESCRIPTION,
        matchPackageNames: ["eslint"],
        allowedVersions: "<10.0.0",
      },
    ]);
    const getLatestEslintVersion = vi.fn(() => "10.5.0");
    const cwd = await createTempRepo({
      "package.json": initialPackageJson,
      "package-lock.json": packageLock("9.39.4"),
      "renovate.json": initialRenovateJson,
      "github-output.txt": "",
    });

    await runPrepareEslintMajorUpgrade({
      cwd,
      env: {
        ESLINT_TARGET_VERSION: "9.99.0",
      },
      getLatestEslintVersion,
      logger: {
        log: vi.fn(),
      },
      outputPath: path.join(cwd, "github-output.txt"),
    });

    expect(getLatestEslintVersion).not.toHaveBeenCalled();
    await expect(readFile(path.join(cwd, "package.json"), "utf8")).resolves.toBe(
      `${JSON.stringify(initialPackageJson, null, 2)}\n`
    );
    await expect(readFile(path.join(cwd, "renovate.json"), "utf8")).resolves.toBe(
      `${JSON.stringify(initialRenovateJson, null, 2)}\n`
    );
    await expect(readFile(path.join(cwd, "github-output.txt"), "utf8")).resolves.toContain(
      "upgrade_needed=false"
    );
  });
});
