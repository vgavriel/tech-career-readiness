#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"
BASE_URL="http://localhost:${PORT}"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}"
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT

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

npm run test:a11y:local
