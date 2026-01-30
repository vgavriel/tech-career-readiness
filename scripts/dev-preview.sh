#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env.preview"

bash "${SCRIPT_DIR}/env-preview.sh"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Env file not found: $ENV_FILE" >&2
  exit 1
fi

bash "${SCRIPT_DIR}/with-env.sh" "$ENV_FILE" npx prisma generate
bash "${SCRIPT_DIR}/with-env.sh" "$ENV_FILE" node "${SCRIPT_DIR}/preview-db-check.mjs"
echo "Starting Next.js with environment loaded from .env.preview."
bash "${SCRIPT_DIR}/with-env.sh" "$ENV_FILE" npm run dev
