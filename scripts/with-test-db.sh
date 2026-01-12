#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.test.yml}"
DB_PORT="${TEST_DB_PORT:-5434}"
DB_NAME="${TEST_DB_NAME:-tech_career_readiness_test}"
DB_USER="${TEST_DB_USER:-postgres}"
DB_PASSWORD="${TEST_DB_PASSWORD:-postgres}"
DEFAULT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}"

export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-test-nextauth-secret}"
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-test-google-client-id}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-test-google-client-secret}"
export LESSON_CONTENT_MOCK_HTML="${LESSON_CONTENT_MOCK_HTML:-<h2>Lesson content</h2><p>Sample lesson content for tests.</p>}"
export PLAYWRIGHT_PORT="${PLAYWRIGHT_PORT:-3001}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:${PLAYWRIGHT_PORT}}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-$PLAYWRIGHT_BASE_URL}"

is_interactive=1
if [[ ! -t 0 ]] || [[ "${CI:-}" == "true" ]] || [[ "${NONINTERACTIVE:-}" == "1" ]]; then
  is_interactive=0
fi

prompt_confirm() {
  local prompt="$1"
  local default="${2:-N}"
  local reply=""

  if [[ "$is_interactive" -ne 1 ]]; then
    return 1
  fi

  if [[ "$default" == "Y" ]]; then
    prompt="${prompt} [Y/n] "
  else
    prompt="${prompt} [y/N] "
  fi

  if ! read -r -p "$prompt" reply </dev/tty; then
    return 1
  fi

  if [[ -z "$reply" ]]; then
    reply="$default"
  fi

  [[ "$reply" =~ ^[Yy]$ ]]
}

open_url() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  else
    echo "Open this URL in your browser: $url"
  fi
}

use_docker=1
if [[ "${USE_EXISTING_DB:-}" == "1" ]]; then
  use_docker=0
fi

if [[ "$use_docker" -eq 1 ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required to run local test DBs."
    if prompt_confirm "Open Docker Desktop download page?" "N"; then
      open_url "https://www.docker.com/products/docker-desktop/"
    fi
    if prompt_confirm "Use an existing DATABASE_URL instead?" "N"; then
      use_docker=0
    else
      exit 1
    fi
  fi
fi

if [[ "$use_docker" -eq 1 ]]; then
  if ! docker info >/dev/null 2>&1; then
    echo "Docker is installed but not running."
    if [[ "${OSTYPE:-}" == darwin* ]]; then
      if [[ "${AUTO_START_DOCKER:-}" == "1" ]] || prompt_confirm "Start Docker Desktop now?" "N"; then
        open -a Docker >/dev/null 2>&1 || true
        echo "Waiting for Docker Desktop to start..."
        for _ in {1..30}; do
          if docker info >/dev/null 2>&1; then
            break
          fi
          sleep 2
        done
      fi
    else
      echo "Start Docker and rerun the command, or use USE_EXISTING_DB=1."
    fi
  fi

  if ! docker info >/dev/null 2>&1; then
    if prompt_confirm "Use an existing DATABASE_URL instead?" "N"; then
      use_docker=0
    else
      echo "Docker daemon is not available." >&2
      exit 1
    fi
  fi
fi

if [[ "$use_docker" -eq 1 ]]; then
  if docker compose version >/dev/null 2>&1; then
    compose() { docker compose -f "$COMPOSE_FILE" "$@"; }
  elif command -v docker-compose >/dev/null 2>&1; then
    compose() { docker-compose -f "$COMPOSE_FILE" "$@"; }
  else
    echo "Docker Compose is required to run local test DBs." >&2
    if prompt_confirm "Open Docker Compose install docs?" "N"; then
      open_url "https://docs.docker.com/compose/install/"
    fi
    exit 1
  fi

  export DATABASE_URL="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"
  compose up -d
fi

cleanup() {
  if [[ "$use_docker" -eq 1 ]] && [[ "${KEEP_TEST_DB:-}" != "1" ]]; then
    compose down -v || true
  fi
}
trap cleanup EXIT

if [[ "$use_docker" -ne 1 ]]; then
  if [[ -z "${DATABASE_URL:-}" ]]; then
    if prompt_confirm "DATABASE_URL is not set. Use ${DEFAULT_DATABASE_URL}?" "N"; then
      export DATABASE_URL="$DEFAULT_DATABASE_URL"
    else
      echo "DATABASE_URL must be set when Docker is disabled." >&2
      exit 1
    fi
  fi
else
  echo "Waiting for test database to become ready..."
  db_ready=0
  for _ in {1..30}; do
    if compose exec -T postgres pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
      db_ready=1
      break
    fi
    sleep 1
  done

  if [[ "$db_ready" -ne 1 ]]; then
    echo "Test database did not become ready in time." >&2
    exit 1
  fi
fi

npx prisma migrate deploy
npx prisma db seed

if [[ "$#" -eq 0 ]]; then
  echo "Provide a command to run, for example: npm run test:integration" >&2
  exit 1
fi

"$@"
