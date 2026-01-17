#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.local"
ENV_EXAMPLE="${ROOT_DIR}/.env.example"
COMPOSE_FILE="${ROOT_DIR}/docker/docker-compose.dev.yml"

# shellcheck source=lib/env-file.sh
source "${SCRIPT_DIR}/lib/env-file.sh"
# shellcheck source=lib/ports.sh
source "${SCRIPT_DIR}/lib/ports.sh"
# shellcheck source=lib/prisma.sh
source "${SCRIPT_DIR}/lib/prisma.sh"

ENV_ONLY=0
if [[ "${1:-}" == "--env-only" ]]; then
  ENV_ONLY=1
  shift
fi

ensure_env_file "$ENV_FILE" "$ENV_EXAMPLE"

is_placeholder() {
  local value="${1:-}"
  [[ -z "$value" || "$value" == replace-with-* ]]
}

resolve_running_dev_db_port() {
  if ! command -v docker >/dev/null 2>&1; then
    return 1
  fi

  if ! docker info >/dev/null 2>&1; then
    return 1
  fi

  local compose_cmd=""
  if docker compose version >/dev/null 2>&1; then
    compose_cmd="docker compose"
  elif command -v docker-compose >/dev/null 2>&1; then
    compose_cmd="docker-compose"
  else
    return 1
  fi

  local container_id=""
  container_id="$($compose_cmd -f "$COMPOSE_FILE" ps -q postgres 2>/dev/null || true)"
  if [[ -z "$container_id" ]]; then
    return 1
  fi

  local mapping=""
  mapping="$(docker port "$container_id" 5432/tcp 2>/dev/null | head -n 1 || true)"
  if [[ -z "$mapping" ]]; then
    return 1
  fi

  local host_port="${mapping##*:}"
  if [[ -z "$host_port" ]]; then
    return 1
  fi

  printf "%s" "$host_port"
}

DEV_DB_PORT="${DEV_DB_PORT:-}"
if [[ -z "$DEV_DB_PORT" ]]; then
  DEV_DB_PORT="$(read_env_value "$ENV_FILE" "DEV_DB_PORT" || true)"
fi
if [[ -z "$DEV_DB_PORT" ]]; then
  DEV_DB_PORT="5435"
fi

running_db_port="$(resolve_running_dev_db_port || true)"
if [[ -n "$running_db_port" ]]; then
  echo "Reusing existing dev database on port ${running_db_port}."
  DEV_DB_PORT="$running_db_port"
else
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
fi

DEV_DB_NAME="tech_career_readiness_dev"
DEV_DB_USER="postgres"
DEV_DB_PASSWORD="postgres"
DATABASE_URL="postgresql://${DEV_DB_USER}:${DEV_DB_PASSWORD}@127.0.0.1:${DEV_DB_PORT}/${DEV_DB_NAME}"

write_env_value "$ENV_FILE" "APP_ENV" "local"
write_env_value "$ENV_FILE" "DEV_DB_PORT" "$DEV_DB_PORT"
write_env_value "$ENV_FILE" "DATABASE_URL" "$DATABASE_URL"

NEXTAUTH_SECRET="$(read_env_value "$ENV_FILE" "NEXTAUTH_SECRET" || true)"
if is_placeholder "$NEXTAUTH_SECRET"; then
  if command -v openssl >/dev/null 2>&1; then
    NEXTAUTH_SECRET="$(openssl rand -base64 32)"
  else
    NEXTAUTH_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")"
  fi
  write_env_value "$ENV_FILE" "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
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

prisma_migrate_and_seed

echo "Dev setup complete. Run: npm run dev"
