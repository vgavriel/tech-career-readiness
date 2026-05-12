#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { resolveBuildVersion } from "./build-version.mjs";

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/with-build-version.mjs <command> [...args]");
  process.exit(1);
}

const { source, version } = resolveBuildVersion();

console.log(`Using app version ${version} (${source}).`);

const result = spawnSync(command, args, {
  env: {
    ...process.env,
    APP_VERSION: version,
    NEXT_BUILD_ID: version,
    NEXT_PUBLIC_APP_VERSION: version,
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
