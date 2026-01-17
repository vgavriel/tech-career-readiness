#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.preview"
ENV_EXAMPLE="${ROOT_DIR}/.env.preview.example"

# shellcheck source=lib/env-file.sh
source "${SCRIPT_DIR}/lib/env-file.sh"

ensure_env_file "$ENV_FILE" "$ENV_EXAMPLE"

write_env_value "$ENV_FILE" "APP_ENV" "preview"

echo "Preview environment file ready. Update values in .env.preview before running dev:preview."
