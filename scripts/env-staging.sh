#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.staging.local"
ENV_EXAMPLE="${ROOT_DIR}/.env.staging.example"

if [[ ! -f "$ENV_EXAMPLE" ]]; then
  echo "Missing ${ENV_EXAMPLE}. Check your repo contents." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created .env.staging.local from .env.staging.example"
fi

write_env_value() {
  local key="$1"
  local value="$2"
  node - "$ENV_FILE" "$key" "$value" <<'NODE'
const fs = require("fs");
const [,, envPath, key, value] = process.argv;
const escapedValue = value.replace(/"/g, '\\"');
const line = `${key}="${escapedValue}"`;
let contents = "";
if (fs.existsSync(envPath)) {
  contents = fs.readFileSync(envPath, "utf8");
}
const regex = new RegExp(`^${key}=.*$`, "m");
if (regex.test(contents)) {
  contents = contents.replace(regex, line);
} else {
  if (contents.length && !contents.endsWith("\n")) {
    contents += "\n";
  }
  contents += `${line}\n`;
}
fs.writeFileSync(envPath, contents);
NODE
}

write_env_value "APP_ENV" "staging"

echo "Staging environment file ready. Update values in .env.staging.local before running dev:staging."
