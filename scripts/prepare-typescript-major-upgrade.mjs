import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_JSON = "package.json";
const PACKAGE_LOCK = "package-lock.json";
const RENOVATE_JSON = "renovate.json";
const TYPESCRIPT_BLOCKER_DESCRIPTION =
  "TypeScript 7 is blocked until Next.js and typescript-eslint support its new package API/layout.";

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

export function getLatestTypeScriptVersionFromNpm(npmViewFn = npmView) {
  return JSON.parse(npmViewFn("typescript", "version"));
}

export function getTypeScriptDependencyLocation(packageJson) {
  if (Object.hasOwn(packageJson.devDependencies ?? {}, "typescript")) {
    return "devDependencies";
  }

  if (Object.hasOwn(packageJson.dependencies ?? {}, "typescript")) {
    return "dependencies";
  }

  return null;
}

export function removeTypeScriptMajorBlockers(packageRules) {
  if (!Array.isArray(packageRules)) {
    return packageRules;
  }

  return packageRules.filter((rule) => {
    const packageNames = rule.matchPackageNames ?? [];
    const matchesTypeScript = packageNames.includes("typescript");
    const isKnownBlocker =
      rule.allowedVersions === "<7.0.0" || rule.description === TYPESCRIPT_BLOCKER_DESCRIPTION;

    return !(matchesTypeScript && isKnownBlocker);
  });
}

export function prepareTypeScriptMajorUpgrade({
  packageJson,
  packageLock,
  renovateJson,
  targetVersion,
}) {
  const dependencyLocation = getTypeScriptDependencyLocation(packageJson);

  if (!dependencyLocation) {
    throw new Error("Unable to find typescript in package.json dependencies.");
  }

  const currentRange = packageJson[dependencyLocation].typescript;
  const lockedVersion = packageLock.packages?.["node_modules/typescript"]?.version;
  const currentVersion = lockedVersion ?? currentRange;
  const currentMajor = parseMajor(currentVersion);
  const targetMajor = parseMajor(targetVersion);

  if (!Number.isFinite(currentMajor) || !Number.isFinite(targetMajor)) {
    throw new Error(
      `Unable to compare TypeScript versions. current=${currentVersion}, latest=${targetVersion}`
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
      message: `No TypeScript major upgrade available. Current major: ${currentMajor}; latest: ${targetVersion}.`,
      upgradeNeeded: false,
    };
  }

  const targetRange = `^${targetMajor}.0.0`;
  const nextPackageJson = structuredClone(packageJson);
  const nextRenovateJson = structuredClone(renovateJson);

  nextPackageJson[dependencyLocation].typescript = targetRange;
  nextRenovateJson.packageRules = removeTypeScriptMajorBlockers(nextRenovateJson.packageRules);

  return {
    ...baseResult,
    message: `Prepared TypeScript major upgrade from ${currentVersion} to ${targetRange} (${targetVersion}).`,
    packageJson: nextPackageJson,
    renovateJson: nextRenovateJson,
    targetRange,
    upgradeNeeded: true,
  };
}

export async function runPrepareTypeScriptMajorUpgrade({
  cwd = process.cwd(),
  env = process.env,
  getLatestTypeScriptVersion = getLatestTypeScriptVersionFromNpm,
  logger = console,
  outputPath = env.GITHUB_OUTPUT,
} = {}) {
  const packageJson = JSON.parse(await readFile(path.join(cwd, PACKAGE_JSON), "utf8"));
  const packageLock = JSON.parse(await readFile(path.join(cwd, PACKAGE_LOCK), "utf8"));
  const renovateJson = JSON.parse(await readFile(path.join(cwd, RENOVATE_JSON), "utf8"));

  const targetVersion = env.TYPESCRIPT_TARGET_VERSION ?? getLatestTypeScriptVersion();
  const result = prepareTypeScriptMajorUpgrade({
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
  await runPrepareTypeScriptMajorUpgrade();
}
