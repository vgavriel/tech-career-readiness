import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearLessonContentCache } from "@/lib/lesson-content-cache";
import { fetchLessonContent } from "@/lib/lesson-content";

const ORIGINAL_ENV = { ...process.env };

const resetEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, ORIGINAL_ENV);
};

const lesson = {
  id: "lesson-1",
  publishedUrl: "https://docs.google.com/document/d/e/lesson-1/pub",
};

describe("fetchLessonContent", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    clearLessonContentCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearLessonContentCache();
    resetEnv();
  });

  it("uses mock HTML in local mode and caches it", async () => {
    process.env.APP_ENV = "local";
    process.env.LESSON_CONTENT_MOCK_HTML = [
      "<h2>Mock</h2>",
      '<p style="position:fixed;color:#111">Hello</p>',
      '<a href="https://example.com" target="_blank">Link</a>',
      '<script>alert("x")</script>',
    ].join("");

    const first = await fetchLessonContent(lesson);

    expect(first.cached).toBe(false);
    expect(first.html).toContain("<h2>Mock</h2>");
    expect(first.html).not.toContain("<script");
    expect(first.html).not.toContain("position:fixed");
    expect(first.html).toMatch(/color:\s*#111/i);
    expect(first.html).toContain('rel="noopener noreferrer"');
    expect(fetchMock).not.toHaveBeenCalled();

    const second = await fetchLessonContent(lesson);

    expect(second.cached).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when the upstream response is not ok", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(new Response("oops", { status: 500 }));

    await expect(fetchLessonContent(lesson)).rejects.toThrow(
      "Failed to fetch lesson content."
    );
  });

  it("throws after too many redirects", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(null, {
          status: 302,
          headers: {
            location:
              "https://docs.google.com/document/d/e/redirected/pub",
          },
        })
      )
    );

    await expect(fetchLessonContent(lesson)).rejects.toThrow(
      "Too many redirects while fetching lesson content."
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("strips Google Docs banners and removes the doc title", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><head>",
          '<style type="text/css">.doc-title{color:#a61c00;font-size:28px;}</style>',
          "</head><body>",
          '<div id="contents">',
          '<p class="doc-title">Tech Recruiting Timeline</p>',
          "<p>Published using Google Docs</p>",
          "<p>Report abuseLearn more</p>",
          "<p>Updated automatically every 5 minutes</p>",
          "<p>Body</p>",
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain("Body");
    expect(result.html).not.toContain("Tech Recruiting Timeline");
    expect(result.html).not.toContain("<style");
    expect(result.html).not.toContain('class="doc-title"');
    expect(result.html).not.toContain("Published using Google Docs");
    expect(result.html).not.toContain("Report abuse");
    expect(result.html).not.toContain("Updated automatically every 5 minutes");
  });
});
