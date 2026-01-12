import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach } from "vitest";

process.env.GOOGLE_CLIENT_ID ??= "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-google-client-secret";
process.env.NEXTAUTH_SECRET ??= "test-nextauth-secret";
process.env.LESSON_CONTENT_MOCK_HTML ??=
  "<h2>Lesson content</h2><p>Sample lesson content for tests.</p>";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for integration tests. Run `npm run test:integration:local` or set DATABASE_URL."
  );
}

let prismaClient: PrismaClient | null = null;

beforeAll(async () => {
  const { prisma } = await import("@/lib/prisma");
  prismaClient = prisma;

  const lessonCount = await prisma.lesson.count();
  if (lessonCount === 0) {
    throw new Error(
      "Integration tests require seeded curriculum data. Run `npm run test:integration:local`."
    );
  }
});

beforeEach(async () => {
  if (!prismaClient) {
    throw new Error("Prisma client was not initialized for integration tests.");
  }

  await prismaClient.lessonProgress.deleteMany();
  await prismaClient.user.deleteMany();
});

afterAll(async () => {
  if (prismaClient) {
    await prismaClient.$disconnect();
  }
});
