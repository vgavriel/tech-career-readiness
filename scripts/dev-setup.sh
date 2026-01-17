#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.local"
ENV_EXAMPLE="${ROOT_DIR}/.env.example"
COMPOSE_FILE="${ROOT_DIR}/docker/docker-compose.dev.yml"

ENV_ONLY=0
if [[ "${1:-}" == "--env-only" ]]; then
  ENV_ONLY=1
  shift
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created .env.local from .env.example"
fi

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

is_placeholder() {
  local value="${1:-}"
  [[ -z "$value" || "$value" == replace-with-* ]]
}

port_in_use() {
  local port="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -n -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi

  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1
    return $?
  fi

  return 1
}

DEV_DB_PORT="${DEV_DB_PORT:-}"
if [[ -z "$DEV_DB_PORT" ]]; then
  DEV_DB_PORT="$(read_env_value DEV_DB_PORT || true)"
fi
if [[ -z "$DEV_DB_PORT" ]]; then
  DEV_DB_PORT="5435"
fi

if port_in_use "$DEV_DB_PORT"; then
  for candidate in 5436 5437 5438 5439 5440 5441 5442 5443 5444 5445; do
    if ! port_in_use "$candidate"; then
      echo "Port ${DEV_DB_PORT} is in use; using ${candidate} instead."
      DEV_DB_PORT="$candidate"
      break
    fi
  done
fi

if port_in_use "$DEV_DB_PORT"; then
  echo "Unable to find a free port for the dev database." >&2
  exit 1
fi

DEV_DB_NAME="tech_career_readiness_dev"
DEV_DB_USER="postgres"
DEV_DB_PASSWORD="postgres"
DATABASE_URL="postgresql://${DEV_DB_USER}:${DEV_DB_PASSWORD}@127.0.0.1:${DEV_DB_PORT}/${DEV_DB_NAME}"

write_env_value "APP_ENV" "local"
write_env_value "DEV_DB_PORT" "$DEV_DB_PORT"
write_env_value "DATABASE_URL" "$DATABASE_URL"

NEXTAUTH_SECRET="$(read_env_value NEXTAUTH_SECRET || true)"
if is_placeholder "$NEXTAUTH_SECRET"; then
  if command -v openssl >/dev/null 2>&1; then
    NEXTAUTH_SECRET="$(openssl rand -base64 32)"
  else
    NEXTAUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  fi
  write_env_value "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
  echo "Generated NEXTAUTH_SECRET"
fi

export DEV_DB_PORT
export DATABASE_URL
export NEXTAUTH_SECRET
export APP_ENV="local"

if [[ "$ENV_ONLY" -eq 1 ]]; then
  echo "Local environment file updated. Run: npm run dev:setup (DB only) or npm run dev:local (DB + server)."
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to start the local dev database." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed but the daemon is not running." >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  compose() { docker compose -f "$COMPOSE_FILE" "$@"; }
elif command -v docker-compose >/dev/null 2>&1; then
  compose() { docker-compose -f "$COMPOSE_FILE" "$@"; }
else
  echo "Docker Compose is required to start the local dev database." >&2
  exit 1
fi

compose up -d

container_id="$(compose ps -q postgres)"
if [[ -z "$container_id" ]]; then
  echo "Unable to find the dev database container." >&2
  exit 1
fi

attempts=20
delay=2
for _ in $(seq 1 "$attempts"); do
  if docker exec "$container_id" pg_isready -U "$DEV_DB_USER" -d "$DEV_DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep "$delay"
done

if ! docker exec "$container_id" pg_isready -U "$DEV_DB_USER" -d "$DEV_DB_NAME" >/dev/null 2>&1; then
  echo "Timed out waiting for the dev database to become ready." >&2
  exit 1
fi

npx prisma migrate deploy
npx prisma generate
npx prisma db seed

echo "Dev setup complete. Run: npm run dev"
