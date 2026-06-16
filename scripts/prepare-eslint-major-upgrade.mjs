import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_JSON = "package.json";
const PACKAGE_LOCK = "package-lock.json";
const RENOVATE_JSON = "renovate.json";
const ESLINT_BLOCKER_DESCRIPTION =
  "ESLint 10 is blocked until eslint-config-next's plugin stack supports it.";

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

export function getLatestEslintVersionFromNpm(npmViewFn = npmView) {
  return JSON.parse(npmViewFn("eslint", "version"));
}

export function getEslintDependencyLocation(packageJson) {
  if (Object.hasOwn(packageJson.devDependencies ?? {}, "eslint")) {
    return "devDependencies";
  }

  if (Object.hasOwn(packageJson.dependencies ?? {}, "eslint")) {
    return "dependencies";
  }

  return null;
}

export function removeEslintMajorBlockers(packageRules) {
  if (!Array.isArray(packageRules)) {
    return packageRules;
  }

  return packageRules.filter((rule) => {
    const packageNames = rule.matchPackageNames ?? [];
    const matchesEslint = packageNames.includes("eslint");
    const isKnownBlocker =
      rule.allowedVersions === "<10.0.0" || rule.description === ESLINT_BLOCKER_DESCRIPTION;

    return !(matchesEslint && isKnownBlocker);
  });
}

export function prepareEslintMajorUpgrade({
  packageJson,
  packageLock,
  renovateJson,
  targetVersion,
}) {
  const eslintDependencyLocation = getEslintDependencyLocation(packageJson);

  if (!eslintDependencyLocation) {
    throw new Error("Unable to find eslint in package.json dependencies.");
  }

  const currentRange = packageJson[eslintDependencyLocation].eslint;
  const lockedVersion = packageLock.packages?.["node_modules/eslint"]?.version;
  const currentVersion = lockedVersion ?? currentRange;
  const currentMajor = parseMajor(currentVersion);
  const targetMajor = parseMajor(targetVersion);

  if (!Number.isFinite(currentMajor) || !Number.isFinite(targetMajor)) {
    throw new Error(
      `Unable to compare ESLint versions. current=${currentVersion}, latest=${targetVersion}`
    );
  }

  const baseResult = {
    currentMajor,
    currentVersion,
    targetMajor,
    targetVersion,
  };

  if (targetMajor <= currentMajor) {
    return {
      ...baseResult,
      message: `No ESLint major upgrade available. Current major: ${currentMajor}; latest: ${targetVersion}.`,
      upgradeNeeded: false,
    };
  }

  const targetRange = `^${targetMajor}.0.0`;
  const nextPackageJson = structuredClone(packageJson);
  const nextRenovateJson = structuredClone(renovateJson);

  nextPackageJson[eslintDependencyLocation].eslint = targetRange;
  nextRenovateJson.packageRules = removeEslintMajorBlockers(nextRenovateJson.packageRules);

  return {
    ...baseResult,
    message: `Prepared ESLint major upgrade from ${currentVersion} to ${targetRange} (${targetVersion}).`,
    packageJson: nextPackageJson,
    renovateJson: nextRenovateJson,
    targetRange,
    upgradeNeeded: true,
  };
}

export async function runPrepareEslintMajorUpgrade({
  cwd = process.cwd(),
  env = process.env,
  getLatestEslintVersion = getLatestEslintVersionFromNpm,
  logger = console,
  outputPath = env.GITHUB_OUTPUT,
} = {}) {
  const packageJson = JSON.parse(await readFile(path.join(cwd, PACKAGE_JSON), "utf8"));
  const packageLock = JSON.parse(await readFile(path.join(cwd, PACKAGE_LOCK), "utf8"));
  const renovateJson = JSON.parse(await readFile(path.join(cwd, RENOVATE_JSON), "utf8"));

  const targetVersion = env.ESLINT_TARGET_VERSION ?? getLatestEslintVersion();
  const result = prepareEslintMajorUpgrade({
    packageJson,
    packageLock,
    renovateJson,
    targetVersion,
  });

  setOutput("current_major", result.currentMajor, outputPath);
  setOutput("current_version", result.currentVersion, outputPath);
  setOutput("target_major", result.targetMajor, outputPath);
  setOutput("target_version", result.targetVersion, outputPath);

  if (!result.upgradeNeeded) {
    logger.log(result.message);
    setOutput("upgrade_needed", "false", outputPath);
    return result;
  }

  await writeFile(path.join(cwd, PACKAGE_JSON), `${JSON.stringify(result.packageJson, null, 2)}\n`);
  await writeFile(
    path.join(cwd, RENOVATE_JSON),
    `${JSON.stringify(result.renovateJson, null, 2)}\n`
  );

  logger.log(result.message);
  setOutput("upgrade_needed", "true", outputPath);
  setOutput("target_range", result.targetRange, outputPath);
  return result;
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli) {
  await runPrepareEslintMajorUpgrade();
}
