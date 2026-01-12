#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.test.yml}"
DB_PORT="${TEST_DB_PORT:-5434}"
DB_NAME="${TEST_DB_NAME:-tech_career_readiness_test}"
DB_USER="${TEST_DB_USER:-postgres}"
DB_PASSWORD="${TEST_DB_PASSWORD:-postgres}"

export DATABASE_URL="${DATABASE_URL:-postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-test-nextauth-secret}"
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-test-google-client-id}"
export GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-test-google-client-secret}"
export LESSON_CONTENT_MOCK_HTML="${LESSON_CONTENT_MOCK_HTML:-<h2>Lesson content</h2><p>Sample lesson content for tests.</p>}"
export PLAYWRIGHT_PORT="${PLAYWRIGHT_PORT:-3001}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:${PLAYWRIGHT_PORT}}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-$PLAYWRIGHT_BASE_URL}"

if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    compose() { docker compose -f "$COMPOSE_FILE" "$@"; }
  elif command -v docker-compose >/dev/null 2>&1; then
    compose() { docker-compose -f "$COMPOSE_FILE" "$@"; }
  else
    echo "Docker Compose is required to run local test DBs." >&2
    exit 1
  fi
else
  echo "Docker is required to run local test DBs." >&2
  exit 1
fi

compose up -d

cleanup() {
  if [[ "${KEEP_TEST_DB:-}" != "1" ]]; then
    compose down -v
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
