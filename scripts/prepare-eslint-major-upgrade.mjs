import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

const PACKAGE_JSON = "package.json";
const PACKAGE_LOCK = "package-lock.json";
const RENOVATE_JSON = "renovate.json";

function parseMajor(version) {
  const match = String(version).match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.NaN;
}

function setOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    appendFileSync(outputPath, `${name}=${value}\n`);
  }
}

function npmView(packageName, field) {
  return execFileSync("npm", ["view", packageName, field, "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  }).trim();
}

const packageJson = JSON.parse(await readFile(PACKAGE_JSON, "utf8"));
const packageLock = JSON.parse(await readFile(PACKAGE_LOCK, "utf8"));
const renovateJson = JSON.parse(await readFile(RENOVATE_JSON, "utf8"));

const currentRange = packageJson.devDependencies?.eslint ?? packageJson.dependencies?.eslint;
const lockedVersion = packageLock.packages?.["node_modules/eslint"]?.version;
const currentMajor = parseMajor(lockedVersion ?? currentRange);
const latestVersion = process.env.ESLINT_TARGET_VERSION
  ? process.env.ESLINT_TARGET_VERSION
  : JSON.parse(npmView("eslint", "version"));
const targetMajor = parseMajor(latestVersion);

if (!Number.isFinite(currentMajor) || !Number.isFinite(targetMajor)) {
  throw new Error(
    `Unable to compare ESLint versions. current=${lockedVersion ?? currentRange}, latest=${latestVersion}`
  );
}

setOutput("current_major", currentMajor);
setOutput("current_version", lockedVersion ?? currentRange);
setOutput("target_major", targetMajor);
setOutput("target_version", latestVersion);

if (targetMajor <= currentMajor) {
  console.log(
    `No ESLint major upgrade available. Current major: ${currentMajor}; latest: ${latestVersion}.`
  );
  setOutput("upgrade_needed", "false");
  process.exit(0);
}

const targetRange = `^${targetMajor}.0.0`;
packageJson.devDependencies.eslint = targetRange;

if (Array.isArray(renovateJson.packageRules)) {
  renovateJson.packageRules = renovateJson.packageRules.filter((rule) => {
    const packageNames = rule.matchPackageNames ?? [];
    const matchesEslint = packageNames.includes("eslint");
    const isKnownBlocker =
      rule.description ===
        "ESLint 10 is blocked until eslint-config-next's plugin stack supports it." ||
      rule.allowedVersions === "<10.0.0";

    return !(matchesEslint && isKnownBlocker);
  });
}

await writeFile(PACKAGE_JSON, `${JSON.stringify(packageJson, null, 2)}\n`);
await writeFile(RENOVATE_JSON, `${JSON.stringify(renovateJson, null, 2)}\n`);

console.log(
  `Prepared ESLint major upgrade from ${lockedVersion ?? currentRange} to ${targetRange} (${latestVersion}).`
);
setOutput("upgrade_needed", "true");
setOutput("target_range", targetRange);
