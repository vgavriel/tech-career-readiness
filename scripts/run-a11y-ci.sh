#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PORT="${PORT:-3000}"
BASE_URL="http://localhost:${PORT}"

is_db_ready() {
  if [[ -z "${DATABASE_URL:-}" ]]; then
    return 1
  fi

  node - <<'NODE'
const { Client } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  process.exit(1);
}

const client = new Client({
  connectionString: url,
  connectionTimeoutMillis: 1500,
});

client
  .connect()
  .then(() => client.end())
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
NODE
}

ensure_test_db() {
  if [[ "${A11Y_DB_READY:-}" == "1" ]] || [[ "${A11Y_SKIP_TEST_DB:-}" == "1" ]]; then
    echo "A11Y DB: using existing database (auto-start disabled)."
    return 0
  fi

  if is_db_ready; then
    echo "A11Y DB: database reachable; using existing database."
    return 0
  fi

  if [[ "${CI:-}" == "true" ]]; then
    echo "Database is not reachable and CI=true; skipping auto DB startup." >&2
    return 0
  fi

  echo "A11Y DB: database not reachable; starting ephemeral test DB..."
  export A11Y_DB_READY=1
  export PORT
  exec "${SCRIPT_DIR}/with-test-db.sh" bash "${SCRIPT_DIR}/run-a11y-ci.sh"
}

ensure_puppeteer_chrome() {
  if node - >/dev/null 2>&1 <<'NODE'
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const executablePath = puppeteer.executablePath();
if (fs.existsSync(executablePath)) {
  process.exit(0);
}

const pathParts = executablePath.split(path.sep);
const chromeIndex = pathParts.lastIndexOf("chrome");
if (chromeIndex !== -1 && pathParts.length > chromeIndex + 1) {
  const browserDir = pathParts.slice(0, chromeIndex + 2).join(path.sep) || path.sep;
  fs.rmSync(browserDir, { recursive: true, force: true });
}

process.exit(1);
NODE
  then
    return 0
  fi

  echo "A11Y browser: Puppeteer Chrome not found; installing..."
  npx puppeteer browsers install chrome
}

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}"
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

ensure_test_db
ensure_puppeteer_chrome

npm run build
PORT="${PORT}" npm run start &
SERVER_PID=$!

for _ in {1..30}; do
  if curl -sf "${BASE_URL}/" >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -sf "${BASE_URL}/" >/dev/null; then
  echo "Server did not start on ${BASE_URL}"
  exit 1
fi

PA11Y_CONFIG="tooling/pa11yci.config.js"

PA11Y_BASE_URL="${BASE_URL}" ./node_modules/.bin/pa11y-ci --config "${PA11Y_CONFIG}"
