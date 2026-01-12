#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.test.yml}"
DB_PORT="${TEST_DB_PORT:-5434}"
DB_NAME="${TEST_DB_NAME:-tech_career_readiness_test}"
DB_USER="${TEST_DB_USER:-postgres}"
DB_PASSWORD="${TEST_DB_PASSWORD:-postgres}"
DEFAULT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}"
OS_NAME="$(uname -s 2>/dev/null || echo "")"
COMMAND_STR="$*"

export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-test-nextauth-secret}"
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-test-google-client-id}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-test-google-client-secret}"
export LESSON_CONTENT_MOCK_HTML="${LESSON_CONTENT_MOCK_HTML:-<h2>Lesson content</h2><p>Sample lesson content for tests.</p>}"

if [[ "$COMMAND_STR" == *"test:e2e"* ]] || [[ "$COMMAND_STR" == *"playwright"* ]]; then
  export PLAYWRIGHT_PORT="${PLAYWRIGHT_PORT:-3001}"
  export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:${PLAYWRIGHT_PORT}}"
  export NEXTAUTH_URL="${NEXTAUTH_URL:-$PLAYWRIGHT_BASE_URL}"
fi

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

DOCKER_BIN="${DOCKER_BIN:-}"
DOCKER_DESKTOP_APP="/Applications/Docker.app"
DOCKER_DESKTOP_BIN="${DOCKER_DESKTOP_APP}/Contents/Resources/bin/docker"

resolve_docker_bin() {
  if [[ -n "$DOCKER_BIN" ]] && [[ -x "$DOCKER_BIN" ]]; then
    return 0
  fi

  if command -v docker >/dev/null 2>&1; then
    DOCKER_BIN="$(command -v docker)"
    return 0
  fi

  if [[ "$OS_NAME" == "Darwin" ]]; then
    local desktop_bin="/Applications/Docker.app/Contents/Resources/bin/docker"
    if [[ -x "$desktop_bin" ]]; then
      DOCKER_BIN="$desktop_bin"
      return 0
    fi
  fi

  return 1
}

resolve_compose_cmd() {
  if "$DOCKER_BIN" compose version >/dev/null 2>&1; then
    compose() { "$DOCKER_BIN" compose -f "$COMPOSE_FILE" "$@"; }
    return 0
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    compose() { docker-compose -f "$COMPOSE_FILE" "$@"; }
    return 0
  fi

  if [[ "$OS_NAME" == "Darwin" ]]; then
    local desktop_compose="/Applications/Docker.app/Contents/Resources/bin/docker-compose"
    if [[ -x "$desktop_compose" ]]; then
      compose() { "$desktop_compose" -f "$COMPOSE_FILE" "$@"; }
      return 0
    fi
  fi

  return 1
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

wait_for_docker_ready() {
  local attempts="${1:-60}"
  local delay="${2:-2}"

  for _ in $(seq 1 "$attempts"); do
    if resolve_docker_bin && "$DOCKER_BIN" info >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay"
  done

  return 1
}

start_docker_desktop() {
  if [[ "$OS_NAME" != "Darwin" ]]; then
    return 1
  fi

  if [[ ! -d "$DOCKER_DESKTOP_APP" ]]; then
    return 1
  fi

  if [[ "${AUTO_START_DOCKER:-1}" == "0" ]]; then
    return 1
  fi

  if [[ "$is_interactive" -ne 1 ]]; then
    return 1
  fi

  echo "Starting Docker Desktop..."
  open -a Docker >/dev/null 2>&1 || true
  echo "Waiting for Docker Desktop to start (approve any system prompts if shown)..."

  if [[ -x "$DOCKER_DESKTOP_BIN" ]]; then
    DOCKER_BIN="$DOCKER_DESKTOP_BIN"
  fi

  if wait_for_docker_ready 60 2; then
    return 0
  fi

  return 1
}

context_hint() {
  local context_lower
  context_lower="$(printf "%s" "$DOCKER_CONTEXT" | tr "[:upper:]" "[:lower:]")"

  case "$context_lower" in
    colima)
      echo "Run: colima start"
      ;;
    orbstack)
      echo "Open OrbStack and start the Docker daemon"
      ;;
    rancher-desktop)
      echo "Start Rancher Desktop"
      ;;
    desktop|desktop-linux)
      echo "Start Docker Desktop"
      ;;
    *)
      echo "Start your Docker daemon for context \"$DOCKER_CONTEXT\""
      ;;
  esac
}

if ! resolve_docker_bin; then
  if [[ "$OS_NAME" == "Darwin" ]] && [[ -d "$DOCKER_DESKTOP_APP" ]]; then
    echo "Docker Desktop is installed, but the Docker CLI isn't available yet."
    start_docker_desktop || true
  fi

  if ! resolve_docker_bin; then
    echo "Docker CLI is required to run local test DBs." >&2
    if prompt_confirm "Open Docker Desktop download page?" "N"; then
      open_url "https://www.docker.com/products/docker-desktop/"
    fi
    exit 1
  fi
fi

DOCKER_CONTEXT="$("$DOCKER_BIN" context show 2>/dev/null | tr -d "\r\n")"
if [[ -z "$DOCKER_CONTEXT" ]]; then
  DOCKER_CONTEXT="default"
fi

if ! "$DOCKER_BIN" info >/dev/null 2>&1; then
  context_lower="$(printf "%s" "$DOCKER_CONTEXT" | tr "[:upper:]" "[:lower:]")"
  if [[ "$OS_NAME" == "Darwin" ]] && [[ "$context_lower" == "desktop"* ]]; then
    start_docker_desktop || true
  fi
fi

if ! "$DOCKER_BIN" info >/dev/null 2>&1; then
  echo "Docker daemon is not available for context \"$DOCKER_CONTEXT\"." >&2
  echo "$(context_hint)." >&2
  exit 1
fi

if ! resolve_compose_cmd; then
  echo "Docker Compose is required to run local test DBs." >&2
  if prompt_confirm "Open Docker Desktop download page?" "N"; then
    open_url "https://www.docker.com/products/docker-desktop/"
  fi
  if prompt_confirm "Open Docker Compose install docs?" "N"; then
    open_url "https://docs.docker.com/compose/install/"
  fi
  exit 1
fi

if port_in_use "$DB_PORT"; then
  if [[ "${TEST_DB_PORT:-}" != "" ]]; then
    echo "TEST_DB_PORT=${DB_PORT} is already in use. Choose a free port." >&2
    exit 1
  fi

  for candidate in 5435 5436 5437 5438 5439 5440 5441 5442 5443 5444 5445; do
    if ! port_in_use "$candidate"; then
      echo "Port ${DB_PORT} is in use; using ${candidate} instead."
      DB_PORT="$candidate"
      break
    fi
  done

  if port_in_use "$DB_PORT"; then
    echo "Unable to find a free port for the test database." >&2
    exit 1
  fi
fi

export TEST_DB_PORT="$DB_PORT"
DEFAULT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}"
export DATABASE_URL="$DEFAULT_DATABASE_URL"
compose up -d

cleanup() {
  if [[ "${KEEP_TEST_DB:-}" != "1" ]]; then
    compose down -v || true
  fi
}
trap cleanup EXIT

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

npx prisma migrate deploy
npx prisma db seed

if [[ "$#" -eq 0 ]]; then
  echo "Provide a command to run, for example: npm run test:integration" >&2
  exit 1
fi

"$@"
