#!/usr/bin/env bash

prisma_generate() {
  npx prisma generate
}

prisma_migrate_and_seed() {
  npx prisma migrate deploy
  prisma_generate
  npx prisma db seed
}
