import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const warn = (message) => {
  console.warn(`\n\n\x1b[33mWarning:\x1b[0m ${message}\n\n`);
};

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  warn("Preview DATABASE_URL is missing; unable to verify migrations or seed.");
  process.exit(0);
}

const getMigrationDirs = () => {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((entry) => fs.statSync(path.join(migrationsDir, entry)).isDirectory());
};

const checkMigrations = async (prisma) => {
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
  } catch {
    warn("Unable to verify preview migrations; run npm run dev:preview:setup.");
  }
};

const checkSeed = async (prisma) => {
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
  } catch {
    warn("Unable to verify preview seed data; run npm run dev:preview:setup.");
  }
};

let prisma;
let pool;

try {
  pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });

  await checkMigrations(prisma);
  await checkSeed(prisma);
} catch {
  warn("Unable to verify preview DB status; run npm run dev:preview:setup.");
} finally {
  if (prisma) {
    await prisma.$disconnect();
  }
  if (pool) {
    await pool.end();
  }
}
