import { afterAll } from "vitest";

process.env.GOOGLE_CLIENT_ID ??= "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-google-client-secret";
process.env.NEXTAUTH_SECRET ??= "test-nextauth-secret";
process.env.DATABASE_URL ??=
  "postgresql://test-user:test-pass@localhost:5432/test-db";
process.env.LESSON_CONTENT_MOCK_HTML ??=
  "<h2>Lesson content</h2><p>Sample lesson content for tests.</p>";

afterAll(async () => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.$disconnect();
});
