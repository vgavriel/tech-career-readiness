import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearLessonContentCache } from "@/lib/lesson-content-cache";

const prismaMock = {
  lesson: {
    findFirst: vi.fn(),
  },
  lessonSlugAlias: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

/**
 * Import the lesson content route handler for testing.
 */
const getRoute = async () => {
  const route = await import("@/app/api/lesson-content/route");
  return route.GET;
};

/**
 * Create a Request for the lesson content route with query parameters.
 */
const makeRequest = (query = "") =>
  new Request(`http://localhost/api/lesson-content${query}`);

describe("GET /api/lesson-content", () => {
  const fetchMock = vi.fn();
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.APP_ENV;
  /**
   * Restore NODE_ENV to its original value for test isolation.
   */
  const restoreNodeEnv = () => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  };
  const restoreAppEnv = () => {
    if (originalAppEnv === undefined) {
      delete process.env.APP_ENV;
    } else {
      process.env.APP_ENV = originalAppEnv;
    }
  };

  beforeEach(() => {
    prismaMock.lesson.findFirst.mockReset();
    prismaMock.lessonSlugAlias.findUnique.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    clearLessonContentCache();
    restoreNodeEnv();
    restoreAppEnv();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearLessonContentCache();
    restoreNodeEnv();
    restoreAppEnv();
  });

  it("returns 400 when no lesson identifier is provided", async () => {
    const GET = await getRoute();
    const response = await GET(makeRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Provide lessonId or slug.",
    });
  });

  it("returns 404 when the lesson is missing", async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);

    const GET = await getRoute();
    const response = await GET(makeRequest("?slug=missing-lesson"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Lesson not found.",
    });
  });

  it("falls back to slug aliases when the canonical slug is missing", async () => {
    prismaMock.lesson.findFirst.mockResolvedValue(null);
    prismaMock.lessonSlugAlias.findUnique.mockResolvedValue({
      lesson: {
        id: "lesson-4",
        publishedUrl: "https://docs.google.com/document/d/e/lesson-4/pub",
        isArchived: false,
      },
    });
    fetchMock.mockResolvedValueOnce(new Response("<p>Alias</p>", { status: 200 }));

    const GET = await getRoute();
    const response = await GET(makeRequest("?slug=old-lesson-slug"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.lessonId).toBe("lesson-4");
    expect(body.html).toContain("Alias");
  });

  it("sanitizes, preserves formatting, and caches lesson content", async () => {
    prismaMock.lesson.findFirst.mockResolvedValue({
      id: "lesson-1",
      publishedUrl: "https://docs.google.com/document/d/e/lesson-1/pub",
    });
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          '<p class="doc-title">Lesson</p>',
          '<p class="doc-emphasis" style="color:#ff0000">Subtitle</p>',
          '<table class="doc-table" style="width:100%">',
          '<tr><th colspan="2" style="text-align:left">Header</th></tr>',
          "</table>",
          "<script>alert(1)</script>",
        ].join(""),
        { status: 200 }
      )
    );

    const GET = await getRoute();
    const response = await GET(makeRequest("?slug=lesson-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cached).toBe(false);
    expect(body.html).not.toContain('class="doc-title"');
    expect(body.html).not.toContain("Lesson</p>");
    expect(body.html).toContain('class="doc-emphasis"');
    expect(body.html).toContain('style="color:#ff0000"');
    expect(body.html).toContain("<table");
    expect(body.html).toContain('colspan="2"');
    expect(body.html).not.toContain("<script");

    const cachedResponse = await GET(makeRequest("?slug=lesson-1"));
    const cachedBody = await cachedResponse.json();

    expect(cachedBody.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("allows cache bypass in local mode", async () => {
    process.env.APP_ENV = "local";
    prismaMock.lesson.findFirst.mockResolvedValue({
      id: "lesson-2",
      publishedUrl: "https://docs.google.com/document/d/e/lesson-2/pub",
    });

    fetchMock.mockResolvedValueOnce(new Response("<p>First</p>", { status: 200 }));
    const GET = await getRoute();
    await GET(makeRequest("?slug=lesson-2"));

    fetchMock.mockResolvedValueOnce(new Response("<p>Second</p>", { status: 200 }));
    await GET(makeRequest("?slug=lesson-2&bypassCache=1"));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("rejects lesson URLs outside the allowlist", async () => {
    prismaMock.lesson.findFirst.mockResolvedValue({
      id: "lesson-3",
      publishedUrl: "https://example.com/lesson-3",
    });

    const GET = await getRoute();
    const response = await GET(makeRequest("?slug=lesson-3"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch lesson content.",
    });
  });
});
