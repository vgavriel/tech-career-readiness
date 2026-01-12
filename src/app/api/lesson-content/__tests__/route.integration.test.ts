import { beforeEach, describe, expect, it } from "vitest";

import { clearLessonContentCache } from "@/lib/lesson-content-cache";
import { prisma } from "@/lib/prisma";

const getRoute = async () => {
  const route = await import("@/app/api/lesson-content/route");
  return route.GET;
};

const makeRequest = (query = "") =>
  new Request(`http://localhost/api/lesson-content${query}`);

describe("integration: GET /api/lesson-content", () => {
  beforeEach(() => {
    clearLessonContentCache();
  });

  it("returns sanitized HTML for a seeded lesson and caches it", async () => {
    const lesson = await prisma.lesson.findUnique({
      where: { slug: "define-your-goal" },
      select: { id: true, slug: true },
    });

    expect(lesson).not.toBeNull();
    if (!lesson) {
      return;
    }

    const originalMockHtml = process.env.LESSON_CONTENT_MOCK_HTML;
    process.env.LESSON_CONTENT_MOCK_HTML =
      "<h2>Lesson content</h2><p>Sample lesson content for tests.</p><script>alert(1)</script>";

    try {
      const GET = await getRoute();
      const response = await GET(makeRequest(`?slug=${lesson.slug}`));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.cached).toBe(false);
      expect(body.html).toContain("Lesson content");
      expect(body.html).toContain("Sample lesson content for tests.");
      expect(body.html).not.toContain("<script");

      const cachedResponse = await GET(makeRequest(`?slug=${lesson.slug}`));
      const cachedBody = await cachedResponse.json();

      expect(cachedBody.cached).toBe(true);
    } finally {
      process.env.LESSON_CONTENT_MOCK_HTML = originalMockHtml;
    }
  });
});
