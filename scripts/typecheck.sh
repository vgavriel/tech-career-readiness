#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  export DATABASE_URL="postgresql://localhost:5432/postgres?schema=public"
fi

npx prisma generate
npx tsc --noEmit
