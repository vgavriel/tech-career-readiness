#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/test-db.sh
source "${SCRIPT_DIR}/lib/test-db.sh"

USE_PLAYWRIGHT=0
if [[ "${1:-}" == "--playwright" ]]; then
  USE_PLAYWRIGHT=1
  shift
fi

require_command "$@"
init_test_db_env

if [[ "$USE_PLAYWRIGHT" -eq 1 ]]; then
  set_playwright_env
fi

trap cleanup EXIT

if [[ "$USE_PLAYWRIGHT" -eq 1 ]]; then
  ensure_playwright_browsers
fi

ensure_docker_ready
select_test_db_port
start_test_db
prisma_migrate_and_seed

"$@"
