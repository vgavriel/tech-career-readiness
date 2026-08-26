import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_JSON = "package.json";
const RENOVATE_JSON = "renovate.json";
const WORKFLOW_DIRECTORY = ".github/workflows";
const NPM_BLOCKER_DESCRIPTION =
  "npm 12 is blocked by npm/cli#9800 until registry tarballs work during lockfile-only installs.";

export function parseMajor(version) {
  const match = String(version).match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.NaN;
}

function setOutput(name, value, outputPath) {
  if (outputPath) {
    appendFileSync(outputPath, `${name}=${value}\n`);
  }
}

export function npmView(packageName, field, execFile = execFileSync) {
  return execFile("npm", ["view", packageName, field, "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

function compareVersions(left, right) {
  const leftParts = String(left)
    .split(".")
    .map((part) => Number.parseInt(part, 10));
  const rightParts = String(right)
    .split(".")
    .map((part) => Number.parseInt(part, 10));

  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

export function getLatestNpmVersionForMajor(targetMajor, npmViewFn = npmView) {
  const metadata = JSON.parse(npmViewFn(`npm@${targetMajor}`, "version"));
  const versions = (Array.isArray(metadata) ? metadata : [metadata]).filter(
    (version) => parseMajor(version) === targetMajor && !String(version).includes("-")
  );

  if (versions.length === 0) {
    throw new Error(`npm did not return a stable release for major ${targetMajor}.`);
  }

  return versions.toSorted(compareVersions).at(-1);
}

export function getNpmEngineUpperBoundMajor(range) {
  const match = String(range).match(/(?:^|\s)<\s*(\d+)/);
  return match ? Number.parseInt(match[1], 10) : Number.NaN;
}

export function removeNpmMajorBlockers(packageRules, targetMajor) {
  if (!Array.isArray(packageRules)) {
    return packageRules;
  }

  return packageRules.filter((rule) => {
    const packageNames = rule.matchPackageNames ?? [];
    const matchesNpm = packageNames.includes("npm");
    const isKnownBlocker =
      rule.allowedVersions === `<${targetMajor}.0.0` ||
      rule.description === NPM_BLOCKER_DESCRIPTION;

    return !(matchesNpm && isKnownBlocker);
  });
}

export function updateNpmWorkflowVersion(contents, targetMajor) {
  return contents
    .replace(/(name:\s*Use npm )\d+/g, `$1${targetMajor}`)
    .replace(/(npm install -g npm@)\d+/g, `$1${targetMajor}`);
}

export function prepareNpmMajorUpgrade({
  packageJson,
  renovateJson,
  targetVersion,
  workflowFiles = {},
}) {
  const currentRange = packageJson.engines?.npm;
  const currentMajor = parseMajor(currentRange);
  const upperBoundMajor = getNpmEngineUpperBoundMajor(currentRange);
  const targetMajor = parseMajor(targetVersion);

  if (
    !Number.isFinite(currentMajor) ||
    !Number.isFinite(upperBoundMajor) ||
    !Number.isFinite(targetMajor)
  ) {
    throw new Error(
      `Unable to compare npm versions. current=${currentRange}, latest=${targetVersion}`
    );
  }

  const baseResult = {
    currentMajor,
    currentRange,
    targetMajor,
    targetVersion,
    upperBoundMajor,
  };

  if (upperBoundMajor > targetMajor) {
    return {
      ...baseResult,
      message: `No npm major upgrade needed. Current range: ${currentRange}; trial target: ${targetVersion}.`,
      upgradeNeeded: false,
    };
  }

  if (upperBoundMajor < targetMajor) {
    throw new Error(
      `Refusing to skip an npm major. Current range: ${currentRange}; trial target: ${targetVersion}.`
    );
  }

  const targetRange = currentRange.replace(
    /(<\s*)\d+/,
    (_match, prefix) => `${prefix}${targetMajor + 1}`
  );
  const nextPackageJson = structuredClone(packageJson);
  const nextRenovateJson = structuredClone(renovateJson);
  const nextWorkflowFiles = Object.fromEntries(
    Object.entries(workflowFiles).map(([fileName, contents]) => [
      fileName,
      updateNpmWorkflowVersion(contents, targetMajor),
    ])
  );

  nextPackageJson.engines.npm = targetRange;
  nextRenovateJson.packageRules = removeNpmMajorBlockers(
    nextRenovateJson.packageRules,
    targetMajor
  );

  return {
    ...baseResult,
    message: `Prepared npm major upgrade from ${currentRange} to ${targetRange} (${targetVersion}).`,
    packageJson: nextPackageJson,
    renovateJson: nextRenovateJson,
    targetRange,
    upgradeNeeded: true,
    workflowFiles: nextWorkflowFiles,
  };
}

async function readWorkflowFiles(cwd) {
  const workflowDirectory = path.join(cwd, WORKFLOW_DIRECTORY);
  const entries = await readdir(workflowDirectory, { withFileTypes: true });
  const workflowNames = entries
    .filter(
      (entry) => entry.isFile() && (entry.name.endsWith(".yml") || entry.name.endsWith(".yaml"))
    )
    .map((entry) => entry.name);

  const workflowEntries = await Promise.all(
    workflowNames.map(async (workflowName) => {
      const relativePath = path.join(WORKFLOW_DIRECTORY, workflowName);
      return [relativePath, await readFile(path.join(cwd, relativePath), "utf8")];
    })
  );

  return Object.fromEntries(workflowEntries);
}

export async function runPrepareNpmMajorUpgrade({
  cwd = process.cwd(),
  env = process.env,
  getLatestNpmVersion = getLatestNpmVersionForMajor,
  logger = console,
  outputPath = env.GITHUB_OUTPUT,
} = {}) {
  const packageJson = JSON.parse(await readFile(path.join(cwd, PACKAGE_JSON), "utf8"));
  const renovateJson = JSON.parse(await readFile(path.join(cwd, RENOVATE_JSON), "utf8"));
  const workflowFiles = await readWorkflowFiles(cwd);
  const configuredTargetMajor = Number.parseInt(
    env.NPM_TARGET_MAJOR ?? getNpmEngineUpperBoundMajor(packageJson.engines?.npm),
    10
  );
  const targetVersion = env.NPM_TARGET_VERSION ?? getLatestNpmVersion(configuredTargetMajor);
  const result = prepareNpmMajorUpgrade({
    packageJson,
    renovateJson,
    targetVersion,
    workflowFiles,
  });

  setOutput("current_major", result.currentMajor, outputPath);
  setOutput("current_range", result.currentRange, outputPath);
  setOutput("target_major", result.targetMajor, outputPath);
  setOutput("target_version", result.targetVersion, outputPath);

  if (!result.upgradeNeeded) {
    logger.log(result.message);
    setOutput("upgrade_needed", "false", outputPath);
    return result;
  }

  await Promise.all([
    writeFile(path.join(cwd, PACKAGE_JSON), `${JSON.stringify(result.packageJson, null, 2)}\n`),
    writeFile(path.join(cwd, RENOVATE_JSON), `${JSON.stringify(result.renovateJson, null, 2)}\n`),
    ...Object.entries(result.workflowFiles).map(([fileName, contents]) =>
      writeFile(path.join(cwd, fileName), contents)
    ),
  ]);

  logger.log(result.message);
  setOutput("upgrade_needed", "true", outputPath);
  setOutput("target_range", result.targetRange, outputPath);
  return result;
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli) {
  await runPrepareNpmMajorUpgrade();
}
