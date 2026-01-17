#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-}"
shift || true

if [[ -z "$ENV_FILE" ]]; then
  echo "Usage: scripts/with-env.sh <env-file> <command...>" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

if [[ "$#" -eq 0 ]]; then
  echo "Provide a command to run with $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

exec "$@"
