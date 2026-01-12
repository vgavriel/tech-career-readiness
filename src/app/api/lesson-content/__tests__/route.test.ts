import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearLessonContentCache } from "@/lib/lesson-content-cache";

const prismaMock = {
  lesson: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const getRoute = async () => {
  const route = await import("@/app/api/lesson-content/route");
  return route.GET;
};

const makeRequest = (query = "") =>
  new Request(`http://localhost/api/lesson-content${query}`);

describe("GET /api/lesson-content", () => {
  const fetchMock = vi.fn();
  const originalNodeEnv = process.env.NODE_ENV;
  const restoreNodeEnv = () => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  };

  beforeEach(() => {
    prismaMock.lesson.findUnique.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    clearLessonContentCache();
    restoreNodeEnv();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearLessonContentCache();
    restoreNodeEnv();
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
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    const GET = await getRoute();
    const response = await GET(makeRequest("?slug=missing-lesson"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Lesson not found.",
    });
  });

  it("sanitizes, preserves formatting, and caches lesson content", async () => {
    prismaMock.lesson.findUnique.mockResolvedValue({
      id: "lesson-1",
      publishedUrl: "https://example.com/lesson-1",
    });
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          '<h1 class="doc-title" style="color:red">Lesson</h1>',
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
    expect(body.html).toContain("<h1");
    expect(body.html).toContain("Lesson</h1>");
    expect(body.html).toContain('class="doc-title"');
    expect(body.html).toContain('style="color:red"');
    expect(body.html).toContain("<table");
    expect(body.html).toContain('colspan="2"');
    expect(body.html).not.toContain("<script");

    const cachedResponse = await GET(makeRequest("?slug=lesson-1"));
    const cachedBody = await cachedResponse.json();

    expect(cachedBody.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("allows cache bypass in development mode", async () => {
    process.env.NODE_ENV = "development";
    prismaMock.lesson.findUnique.mockResolvedValue({
      id: "lesson-2",
      publishedUrl: "https://example.com/lesson-2",
    });

    fetchMock.mockResolvedValueOnce(new Response("<p>First</p>", { status: 200 }));
    const GET = await getRoute();
    await GET(makeRequest("?slug=lesson-2"));

    fetchMock.mockResolvedValueOnce(new Response("<p>Second</p>", { status: 200 }));
    await GET(makeRequest("?slug=lesson-2&bypassCache=1"));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
