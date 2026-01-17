#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.local"
# shellcheck source=lib/env-file.sh
source "${SCRIPT_DIR}/lib/env-file.sh"
# shellcheck source=lib/prisma.sh
source "${SCRIPT_DIR}/lib/prisma.sh"

if [[ ! -f "$ENV_FILE" ]]; then
  ENV_FILE="${ROOT_DIR}/.env.preview"
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  prisma_generate
  exit 0
fi

DATABASE_URL="$(read_env_value "$ENV_FILE" "DATABASE_URL" || true)"
if [[ -n "$DATABASE_URL" ]]; then
  export DATABASE_URL
  prisma_generate
  exit 0
fi

echo "Skipping prisma generate because DATABASE_URL is not set."
echo "Run: npm run dev:setup or set DATABASE_URL then run npx prisma generate."
