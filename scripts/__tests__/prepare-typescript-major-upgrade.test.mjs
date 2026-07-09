import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLatestTypeScriptVersionFromNpm,
  getTypeScriptDependencyLocation,
  npmView,
  parseMajor,
  prepareTypeScriptMajorUpgrade,
  removeTypeScriptMajorBlockers,
  runPrepareTypeScriptMajorUpgrade,
} from "../prepare-typescript-major-upgrade.mjs";

const BLOCKER_DESCRIPTION =
  "TypeScript 7 is blocked until Next.js and typescript-eslint support its new package API/layout.";

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
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "typescript-major-test-"));
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
      typescript: "^6.0.0",
      vitest: "^4.0.17",
    },
    ...overrides,
  };
}

function packageLock(version = "6.0.3") {
  return {
    lockfileVersion: 3,
    packages: {
      "": {
        devDependencies: {
          typescript: "^6.0.0",
        },
      },
      "node_modules/typescript": {
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
    expect(parseMajor("7.0.2")).toBe(7);
    expect(parseMajor("^6.0.0")).toBe(6);
    expect(parseMajor(">=4.8.4 <6.1.0")).toBe(4);
  });

  it("returns NaN for values without a numeric segment", () => {
    expect(Number.isNaN(parseMajor("next"))).toBe(true);
    expect(Number.isNaN(parseMajor(undefined))).toBe(true);
  });
});

describe("getTypeScriptDependencyLocation", () => {
  it("prefers devDependencies when typescript appears in both dependency sections", () => {
    expect(
      getTypeScriptDependencyLocation({
        dependencies: { typescript: "^5" },
        devDependencies: { typescript: "^6.0.0" },
      })
    ).toBe("devDependencies");
  });

  it("falls back to dependencies when typescript is not a dev dependency", () => {
    expect(
      getTypeScriptDependencyLocation({
        dependencies: { typescript: "^6.0.0" },
      })
    ).toBe("dependencies");
  });

  it("returns null when package.json does not declare typescript", () => {
    expect(getTypeScriptDependencyLocation({ devDependencies: {} })).toBeNull();
  });
});

describe("npm metadata helpers", () => {
  it("reads package metadata through npm view with JSON output", () => {
    const execFile = vi.fn(() => "7.0.2\n");

    expect(npmView("typescript", "version", execFile)).toBe("7.0.2");
    expect(execFile).toHaveBeenCalledWith("npm", ["view", "typescript", "version", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    });
  });

  it("parses the latest TypeScript version from npm JSON output", () => {
    expect(getLatestTypeScriptVersionFromNpm(() => '"7.0.2"')).toBe("7.0.2");
  });
});

describe("removeTypeScriptMajorBlockers", () => {
  it("removes only typescript rules that match the known major blocker", () => {
    const rules = [
      {
        matchManagers: ["npm"],
        postUpdateOptions: ["npmInstallTwice"],
      },
      {
        description: BLOCKER_DESCRIPTION,
        matchPackageNames: ["typescript"],
        allowedVersions: "<7.0.0",
      },
      {
        matchPackageNames: ["typescript"],
        dependencyDashboardApproval: true,
      },
      {
        matchPackageNames: ["eslint"],
        allowedVersions: "<10.0.0",
      },
    ];

    expect(removeTypeScriptMajorBlockers(rules)).toEqual([rules[0], rules[2], rules[3]]);
  });

  it("leaves non-array packageRules unchanged", () => {
    expect(removeTypeScriptMajorBlockers(undefined)).toBeUndefined();
  });
});

describe("prepareTypeScriptMajorUpgrade", () => {
  it("returns a no-op result when the latest TypeScript major is already installed", () => {
    const result = prepareTypeScriptMajorUpgrade({
      packageJson: packageJson(),
      packageLock: packageLock("6.0.3"),
      renovateJson: renovateJson(),
      targetVersion: "6.9.0",
    });

    expect(result).toMatchObject({
      currentMajor: 6,
      currentVersion: "6.0.3",
      targetMajor: 6,
      targetVersion: "6.9.0",
      upgradeNeeded: false,
    });
    expect(result.targetRange).toBeUndefined();
  });

  it("updates the typescript dev dependency and removes the Renovate blocker for a newer major", () => {
    const originalPackageJson = packageJson();
    const originalRenovateJson = renovateJson([
      {
        matchManagers: ["npm"],
        postUpdateOptions: ["npmInstallTwice"],
      },
      {
        description: BLOCKER_DESCRIPTION,
        matchManagers: ["npm"],
        matchPackageNames: ["typescript"],
        allowedVersions: "<7.0.0",
      },
      {
        matchPackageNames: ["typescript"],
        dependencyDashboardApproval: true,
      },
    ]);

    const result = prepareTypeScriptMajorUpgrade({
      packageJson: originalPackageJson,
      packageLock: packageLock("6.0.3"),
      renovateJson: originalRenovateJson,
      targetVersion: "7.0.2",
    });

    expect(result).toMatchObject({
      currentMajor: 6,
      currentVersion: "6.0.3",
      targetMajor: 7,
      targetRange: "^7.0.0",
      targetVersion: "7.0.2",
      upgradeNeeded: true,
    });
    expect(result.packageJson.devDependencies.typescript).toBe("^7.0.0");
    expect(result.renovateJson.packageRules).toEqual([
      originalRenovateJson.packageRules[0],
      originalRenovateJson.packageRules[2],
    ]);
    expect(originalPackageJson.devDependencies.typescript).toBe("^6.0.0");
    expect(originalRenovateJson.packageRules).toHaveLength(3);
  });

  it("updates typescript in dependencies when it is not a dev dependency", () => {
    const result = prepareTypeScriptMajorUpgrade({
      packageJson: packageJson({
        dependencies: {
          typescript: "^6.0.0",
        },
        devDependencies: {
          vitest: "^4.0.17",
        },
      }),
      packageLock: packageLock("6.0.3"),
      renovateJson: renovateJson(),
      targetVersion: "7.0.2",
    });

    expect(result.packageJson.dependencies.typescript).toBe("^7.0.0");
  });

  it("uses the package range when the lockfile has no typescript entry", () => {
    const result = prepareTypeScriptMajorUpgrade({
      packageJson: packageJson(),
      packageLock: {
        packages: {},
      },
      renovateJson: renovateJson(),
      targetVersion: "7.0.2",
    });

    expect(result.currentVersion).toBe("^6.0.0");
    expect(result.upgradeNeeded).toBe(true);
  });

  it("throws when package.json does not declare typescript", () => {
    expect(() =>
      prepareTypeScriptMajorUpgrade({
        packageJson: packageJson({
          devDependencies: {
            vitest: "^4.0.17",
          },
        }),
        packageLock: packageLock("6.0.3"),
        renovateJson: renovateJson(),
        targetVersion: "7.0.2",
      })
    ).toThrow("Unable to find typescript");
  });

  it("throws when current or target versions cannot be compared", () => {
    expect(() =>
      prepareTypeScriptMajorUpgrade({
        packageJson: packageJson({
          devDependencies: {
            typescript: "latest",
          },
        }),
        packageLock: {
          packages: {},
        },
        renovateJson: renovateJson(),
        targetVersion: "next",
      })
    ).toThrow("Unable to compare TypeScript versions");
  });
});

describe("runPrepareTypeScriptMajorUpgrade", () => {
  it("writes package and Renovate changes plus GitHub outputs for a compatible trial target", async () => {
    const cwd = await createTempRepo({
      "package.json": packageJson(),
      "package-lock.json": packageLock("6.0.3"),
      "renovate.json": renovateJson([
        {
          matchManagers: ["npm"],
          postUpdateOptions: ["npmInstallTwice"],
        },
        {
          description: BLOCKER_DESCRIPTION,
          matchPackageNames: ["typescript"],
          allowedVersions: "<7.0.0",
        },
      ]),
      "github-output.txt": "",
    });
    const logger = {
      log: vi.fn(),
    };

    const result = await runPrepareTypeScriptMajorUpgrade({
      cwd,
      env: {},
      getLatestTypeScriptVersion: () => "7.0.2",
      logger,
      outputPath: path.join(cwd, "github-output.txt"),
    });

    const nextPackageJson = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"));
    const nextRenovateJson = JSON.parse(await readFile(path.join(cwd, "renovate.json"), "utf8"));
    const output = await readFile(path.join(cwd, "github-output.txt"), "utf8");

    expect(result.upgradeNeeded).toBe(true);
    expect(nextPackageJson.devDependencies.typescript).toBe("^7.0.0");
    expect(nextRenovateJson.packageRules).toEqual([
      {
        matchManagers: ["npm"],
        postUpdateOptions: ["npmInstallTwice"],
      },
    ]);
    expect(output).toContain("upgrade_needed=true");
    expect(output).toContain("target_range=^7.0.0");
    expect(logger.log).toHaveBeenCalledWith(
      "Prepared TypeScript major upgrade from 6.0.3 to ^7.0.0 (7.0.2)."
    );
  });

  it("does not rewrite files when no newer major is available", async () => {
    const initialPackageJson = packageJson();
    const initialRenovateJson = renovateJson([
      {
        description: BLOCKER_DESCRIPTION,
        matchPackageNames: ["typescript"],
        allowedVersions: "<7.0.0",
      },
    ]);
    const getLatestTypeScriptVersion = vi.fn(() => "7.0.2");
    const cwd = await createTempRepo({
      "package.json": initialPackageJson,
      "package-lock.json": packageLock("6.0.3"),
      "renovate.json": initialRenovateJson,
      "github-output.txt": "",
    });

    await runPrepareTypeScriptMajorUpgrade({
      cwd,
      env: {
        TYPESCRIPT_TARGET_VERSION: "6.9.0",
      },
      getLatestTypeScriptVersion,
      logger: {
        log: vi.fn(),
      },
      outputPath: path.join(cwd, "github-output.txt"),
    });

    expect(getLatestTypeScriptVersion).not.toHaveBeenCalled();
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
