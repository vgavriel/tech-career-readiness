import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

import { getEnv, requireEnv } from "@/lib/env";

const env = getEnv();
const databaseUrl = requireEnv(env.DATABASE_URL, "DATABASE_URL");

/**
 * Global cache for Prisma client and pool to survive hot reloads in dev.
 */
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

const pool = globalForPrisma.prismaPool ?? new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

/**
 * Shared Prisma client instance configured with the Postgres adapter.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = pool;
}
