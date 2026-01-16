#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

read_env_value() {
  local key="$1"
  node - "$ENV_FILE" "$key" <<'NODE'
const fs = require("fs");
const [,, envPath, key] = process.argv;
if (!fs.existsSync(envPath)) {
  process.exit(1);
}
const contents = fs.readFileSync(envPath, "utf8");
const match = contents.match(new RegExp(`^${key}=(.*)$`, "m"));
if (!match) {
  process.exit(1);
}
let value = match[1].trim();
if (
  (value.startsWith('"') && value.endsWith('"')) ||
  (value.startsWith("'") && value.endsWith("'"))
) {
  value = value.slice(1, -1);
}
process.stdout.write(value);
NODE
}

if [[ -n "${DATABASE_URL:-}" ]]; then
  npx prisma generate
  exit 0
fi

DATABASE_URL="$(read_env_value DATABASE_URL || true)"
if [[ -n "$DATABASE_URL" ]]; then
  export DATABASE_URL
  npx prisma generate
  exit 0
fi

echo "Skipping prisma generate because DATABASE_URL is not set."
echo "Run: npm run dev:setup or set DATABASE_URL then run npx prisma generate."
