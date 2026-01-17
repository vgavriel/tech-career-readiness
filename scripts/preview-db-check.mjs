import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { PrismaClient } from "@prisma/client";

const warn = (message) => {
  console.warn(`Warning: ${message}`);
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  warn("Preview DATABASE_URL is missing; unable to verify migrations or seed.");
  process.exit(0);
}

const prisma = new PrismaClient();

const getMigrationDirs = () => {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((entry) => fs.statSync(path.join(migrationsDir, entry)).isDirectory());
};

const checkMigrations = async () => {
  const migrationDirs = getMigrationDirs();
  if (migrationDirs.length === 0) {
    return;
  }

  try {
    const rows = await prisma.$queryRaw`
      SELECT migration_name
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL
    `;

    const applied = new Set(rows.map((row) => row.migration_name));
    const missing = migrationDirs.filter((name) => !applied.has(name));

    if (missing.length > 0) {
      warn(
        `Preview DB is missing migrations: ${missing.join(", ")}. Run npm run dev:preview:setup.`
      );
    }
  } catch (error) {
    warn("Unable to verify preview migrations; run npm run dev:preview:setup.");
  }
};

const checkSeed = async () => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT EXISTS(
        SELECT 1
        FROM "Module"
        WHERE key = 'start-here'
      ) AS "seeded"
    `;

    const seeded = Boolean(rows?.[0]?.seeded);
    if (!seeded) {
      warn("Preview DB appears unseeded; run npm run dev:preview:setup.");
    }
  } catch (error) {
    warn("Unable to verify preview seed data; run npm run dev:preview:setup.");
  }
};

try {
  await checkMigrations();
  await checkSeed();
} finally {
  await prisma.$disconnect();
}
