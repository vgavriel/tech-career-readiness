#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/test-db.sh
source "${SCRIPT_DIR}/lib/test-db.sh"

require_command "$@"
init_test_db_env
set_playwright_env
trap cleanup EXIT

ensure_playwright_browsers
ensure_docker_ready
select_test_db_port
start_test_db
migrate_and_seed

"$@"
