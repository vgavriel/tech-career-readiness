import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLatestNpmVersionForMajor,
  getNpmEngineUpperBoundMajor,
  npmView,
  parseMajor,
  prepareNpmMajorUpgrade,
  removeNpmMajorBlockers,
  runPrepareNpmMajorUpgrade,
  updateNpmWorkflowVersion,
} from "../prepare-npm-major-upgrade.mjs";

const BLOCKER_DESCRIPTION =
  "npm 12 is blocked by npm/cli#9800 until registry tarballs work during lockfile-only installs.";

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
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "npm-major-test-"));
  tmpDirs.push(tmpDir);

  await Promise.all(
    Object.entries(files).map(async ([fileName, contents]) => {
      const filePath = path.join(tmpDir, fileName);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(
        filePath,
        typeof contents === "string" ? contents : `${JSON.stringify(contents, null, 2)}\n`
      );
    })
  );

  return tmpDir;
}

function packageJson(npmRange = ">=11.9.0 <12") {
  return {
    name: "tmp-next",
    private: true,
    engines: {
      npm: npmRange,
    },
  };
}

function renovateJson(packageRules = []) {
  return {
    $schema: "https://docs.renovatebot.com/renovate-schema.json",
    packageRules,
  };
}

function npmBlocker() {
  return {
    description: BLOCKER_DESCRIPTION,
    matchManagers: ["npm"],
    matchPackageNames: ["npm"],
    allowedVersions: "<12.0.0",
  };
}

const ciWorkflow = `name: CI
steps:
  - name: Use npm 11
    run: npm install -g npm@11
`;

describe("version parsing", () => {
  it("extracts npm majors and engine upper bounds", () => {
    expect(parseMajor("12.0.2")).toBe(12);
    expect(parseMajor(">=11.9.0 <12")).toBe(11);
    expect(getNpmEngineUpperBoundMajor(">=11.9.0 <12")).toBe(12);
  });

  it("returns NaN when a version or upper bound is unavailable", () => {
    expect(Number.isNaN(parseMajor("latest"))).toBe(true);
    expect(Number.isNaN(getNpmEngineUpperBoundMajor(">=11.9.0"))).toBe(true);
  });
});

describe("npm metadata helpers", () => {
  it("reads package metadata through npm view with JSON output", () => {
    const execFile = vi.fn(() => '["12.0.0","12.0.2"]\n');

    expect(npmView("npm@12", "version", execFile)).toBe('["12.0.0","12.0.2"]');
    expect(execFile).toHaveBeenCalledWith("npm", ["view", "npm@12", "version", "--json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    });
  });

  it("selects the newest stable release in the requested npm major", () => {
    expect(
      getLatestNpmVersionForMajor(12, () =>
        JSON.stringify(["12.0.2", "12.0.0", "12.1.0-beta.0", "12.0.10"])
      )
    ).toBe("12.0.10");
  });

  it("accepts npm view output containing a single version", () => {
    expect(getLatestNpmVersionForMajor(12, () => '"12.0.2"')).toBe("12.0.2");
  });

  it("throws when npm returns no stable release in the requested major", () => {
    expect(() => getLatestNpmVersionForMajor(12, () => '["12.1.0-beta.0"]')).toThrow(
      "stable release for major 12"
    );
  });
});

describe("Renovate and workflow updates", () => {
  it("removes only the known npm major blocker", () => {
    const rules = [
      {
        matchManagers: ["npm"],
        postUpdateOptions: ["npmInstallTwice"],
      },
      npmBlocker(),
      {
        matchPackageNames: ["npm"],
        dependencyDashboardApproval: true,
      },
      {
        matchPackageNames: ["typescript"],
        allowedVersions: "<7.0.0",
      },
    ];

    expect(removeNpmMajorBlockers(rules, 12)).toEqual([rules[0], rules[2], rules[3]]);
  });

  it("leaves non-array packageRules unchanged", () => {
    expect(removeNpmMajorBlockers(undefined, 12)).toBeUndefined();
  });

  it("updates npm setup labels and commands without changing unrelated workflow text", () => {
    expect(updateNpmWorkflowVersion(ciWorkflow, 12)).toBe(
      ciWorkflow.replace("Use npm 11", "Use npm 12").replace("npm@11", "npm@12")
    );
    expect(updateNpmWorkflowVersion("uses: actions/setup-node@v7\n", 12)).toBe(
      "uses: actions/setup-node@v7\n"
    );
  });
});

describe("prepareNpmMajorUpgrade", () => {
  it("widens the npm engine, removes the blocker, and updates workflow npm versions", () => {
    const originalPackageJson = packageJson();
    const originalRenovateJson = renovateJson([
      {
        matchManagers: ["npm"],
        postUpdateOptions: ["npmInstallTwice"],
      },
      npmBlocker(),
      {
        matchPackageNames: ["eslint"],
        allowedVersions: "<10.0.0",
      },
    ]);
    const originalWorkflows = {
      ".github/workflows/ci.yml": ciWorkflow,
      ".github/workflows/codeql.yml": "uses: github/codeql-action/init@v4\n",
    };

    const result = prepareNpmMajorUpgrade({
      packageJson: originalPackageJson,
      renovateJson: originalRenovateJson,
      targetVersion: "12.0.2",
      workflowFiles: originalWorkflows,
    });

    expect(result).toMatchObject({
      currentMajor: 11,
      currentRange: ">=11.9.0 <12",
      targetMajor: 12,
      targetRange: ">=11.9.0 <13",
      targetVersion: "12.0.2",
      upgradeNeeded: true,
      upperBoundMajor: 12,
    });
    expect(result.packageJson.engines.npm).toBe(">=11.9.0 <13");
    expect(result.renovateJson.packageRules).toEqual([
      originalRenovateJson.packageRules[0],
      originalRenovateJson.packageRules[2],
    ]);
    expect(result.workflowFiles[".github/workflows/ci.yml"]).toContain("Use npm 12");
    expect(result.workflowFiles[".github/workflows/ci.yml"]).toContain("npm@12");
    expect(result.workflowFiles[".github/workflows/codeql.yml"]).toBe(
      originalWorkflows[".github/workflows/codeql.yml"]
    );
    expect(originalPackageJson.engines.npm).toBe(">=11.9.0 <12");
    expect(originalRenovateJson.packageRules).toHaveLength(3);
    expect(originalWorkflows[".github/workflows/ci.yml"]).toBe(ciWorkflow);
  });

  it("returns a no-op when the target major is already allowed", () => {
    const result = prepareNpmMajorUpgrade({
      packageJson: packageJson(">=11.9.0 <13"),
      renovateJson: renovateJson([npmBlocker()]),
      targetVersion: "12.0.2",
      workflowFiles: {
        ".github/workflows/ci.yml": ciWorkflow,
      },
    });

    expect(result).toMatchObject({
      targetMajor: 12,
      upgradeNeeded: false,
      upperBoundMajor: 13,
    });
    expect(result.packageJson).toBeUndefined();
  });

  it("refuses to skip over an untested npm major", () => {
    expect(() =>
      prepareNpmMajorUpgrade({
        packageJson: packageJson(),
        renovateJson: renovateJson(),
        targetVersion: "13.0.0",
      })
    ).toThrow("Refusing to skip an npm major");
  });

  it("throws when the npm engine range cannot be compared", () => {
    expect(() =>
      prepareNpmMajorUpgrade({
        packageJson: packageJson(">=11.9.0"),
        renovateJson: renovateJson(),
        targetVersion: "12.0.2",
      })
    ).toThrow("Unable to compare npm versions");
  });
});

describe("runPrepareNpmMajorUpgrade", () => {
  it("writes dependency and workflow changes plus GitHub outputs for a trial target", async () => {
    const cwd = await createTempRepo({
      "package.json": packageJson(),
      "renovate.json": renovateJson([npmBlocker()]),
      ".github/workflows/ci.yml": ciWorkflow,
      ".github/workflows/codeql.yml": "uses: github/codeql-action/init@v4\n",
      "github-output.txt": "",
    });
    const logger = {
      log: vi.fn(),
    };
    const getLatestNpmVersion = vi.fn(() => "12.0.2");

    const result = await runPrepareNpmMajorUpgrade({
      cwd,
      env: {
        NPM_TARGET_MAJOR: "12",
      },
      getLatestNpmVersion,
      logger,
      outputPath: path.join(cwd, "github-output.txt"),
    });

    const nextPackageJson = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"));
    const nextRenovateJson = JSON.parse(await readFile(path.join(cwd, "renovate.json"), "utf8"));
    const nextCiWorkflow = await readFile(path.join(cwd, ".github/workflows/ci.yml"), "utf8");
    const output = await readFile(path.join(cwd, "github-output.txt"), "utf8");

    expect(result.upgradeNeeded).toBe(true);
    expect(getLatestNpmVersion).toHaveBeenCalledWith(12);
    expect(nextPackageJson.engines.npm).toBe(">=11.9.0 <13");
    expect(nextRenovateJson.packageRules).toEqual([]);
    expect(nextCiWorkflow).toContain("Use npm 12");
    expect(nextCiWorkflow).toContain("npm@12");
    expect(output).toContain("upgrade_needed=true");
    expect(output).toContain("target_range=>=11.9.0 <13");
    expect(output).toContain("target_version=12.0.2");
    expect(logger.log).toHaveBeenCalledWith(
      "Prepared npm major upgrade from >=11.9.0 <12 to >=11.9.0 <13 (12.0.2)."
    );
  });

  it("does not query npm or rewrite files when the target major is already allowed", async () => {
    const initialPackageJson = packageJson(">=11.9.0 <13");
    const initialRenovateJson = renovateJson([npmBlocker()]);
    const cwd = await createTempRepo({
      "package.json": initialPackageJson,
      "renovate.json": initialRenovateJson,
      ".github/workflows/ci.yml": ciWorkflow,
      "github-output.txt": "",
    });
    const getLatestNpmVersion = vi.fn(() => "12.0.2");

    await runPrepareNpmMajorUpgrade({
      cwd,
      env: {
        NPM_TARGET_MAJOR: "12",
        NPM_TARGET_VERSION: "12.0.2",
      },
      getLatestNpmVersion,
      logger: {
        log: vi.fn(),
      },
      outputPath: path.join(cwd, "github-output.txt"),
    });

    expect(getLatestNpmVersion).not.toHaveBeenCalled();
    await expect(readFile(path.join(cwd, "package.json"), "utf8")).resolves.toBe(
      `${JSON.stringify(initialPackageJson, null, 2)}\n`
    );
    await expect(readFile(path.join(cwd, "renovate.json"), "utf8")).resolves.toBe(
      `${JSON.stringify(initialRenovateJson, null, 2)}\n`
    );
    await expect(readFile(path.join(cwd, ".github/workflows/ci.yml"), "utf8")).resolves.toBe(
      ciWorkflow
    );
    await expect(readFile(path.join(cwd, "github-output.txt"), "utf8")).resolves.toContain(
      "upgrade_needed=false"
    );
  });
});
