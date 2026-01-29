import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchLessonContent } from "@/lib/lesson-content";
import { clearLessonContentCache } from "@/lib/lesson-content/cache";

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
      '<p style="position:fixed;font-weight:700;font-style:italic;text-decoration:underline;color:#111">Hello</p>',
      '<a href="https://example.com">Link</a>',
      '<script>alert("x")</script>',
    ].join("");

    const first = await fetchLessonContent(lesson);

    expect(first.cached).toBe(false);
    expect(first.html).toContain("<h2>Mock</h2>");
    expect(first.html).not.toContain("<script");
    expect(first.html).not.toContain("position:fixed");
    expect(first.html).not.toContain("style=");
    expect(first.html).toContain("doc-bold");
    expect(first.html).toContain("doc-italic");
    expect(first.html).toContain("doc-underline");
    expect(first.html).toContain('target="_blank"');
    expect(first.html).toContain('rel="noopener noreferrer"');
    expect(fetchMock).not.toHaveBeenCalled();

    const second = await fetchLessonContent(lesson);

    expect(second.cached).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves allowed images and drops untrusted ones", async () => {
    process.env.APP_ENV = "local";
    process.env.LESSON_CONTENT_MOCK_HTML = [
      '<img src="https://lh3.googleusercontent.com/abc" style="width: 120px; height: 240px;" />',
      '<img src="https://example.com/evil.png" />',
      '<span style="background-image:url(https://lh4.googleusercontent.com/def); width: 300px; height: 400px;"></span>',
    ].join("");

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain("lh3.googleusercontent.com/abc");
    expect(result.html).toContain('width="120"');
    expect(result.html).toContain('height="240"');
    expect(result.html).not.toContain("example.com/evil.png");
    expect(result.html).toContain("lh4.googleusercontent.com/def");
  });

  it("converts background image classes into images", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><head>",
          "<style>",
          ".c1{background-image:url('https://lh3.googleusercontent.com/classy'); width:120pt; height:60pt;}",
          ".c2{background-image:url('https://example.com/evil.png'); width:120pt; height:60pt;}",
          "</style>",
          "</head><body>",
          '<div id="contents">',
          '<span class="c1"></span>',
          '<span class="c2"></span>',
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain("lh3.googleusercontent.com/classy");
    expect(result.html).toContain('width="160"');
    expect(result.html).toContain('height="80"');
    expect(result.html).not.toContain("example.com/evil.png");
  });

  it("drops leading banner images while keeping content images", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          '<p><img src="https://lh3.googleusercontent.com/banner=w1200-h200" width="1200" height="200" /></p>',
          '<p><img src="https://lh3.googleusercontent.com/resume=w800-h1100" width="800" height="1100" /></p>',
          "<p>Body</p>",
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).not.toContain("banner=w1200-h200");
    expect(result.html).toContain("resume=w800-h1100");
    expect(result.html).toContain("Body");
  });

  it("throws when the upstream response is not ok", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(new Response("oops", { status: 500 }));

    await expect(fetchLessonContent(lesson)).rejects.toThrow("Failed to fetch lesson content.");
  });

  it("throws after too many redirects", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(null, {
          status: 302,
          headers: {
            location: "https://docs.google.com/document/d/e/redirected/pub",
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

  it("removes the standard lesson footer content", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          '<div class="doc-content">',
          "<p>Lesson body</p>",
          "<hr>",
          "<p>Questions? Reach out: Center for Career Exploration</p>",
          "<p>Author: Test Author</p>",
          "<p>Last updated May 6, 2025</p>",
          "<p>Footer note</p>",
          "</div>",
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain("Lesson body");
    expect(result.html).not.toContain("Questions? Reach out");
    expect(result.html).not.toContain("Author:");
    expect(result.html).not.toContain("Last updated");
    expect(result.html).not.toContain("Footer note");
    expect(result.html).not.toContain("<hr");
  });

  it("removes horizontal rules inside lesson content", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          "<p>Section one</p>",
          "<hr>",
          "<p>Section two</p>",
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain("Section one");
    expect(result.html).toContain("Section two");
    expect(result.html).not.toContain("<hr");
  });

  it("trims leading whitespace in table cells", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          "<table>",
          "<tr>",
          "<td><p> </p><p>First</p></td>",
          "<td><p>&nbsp;</p><p>&nbsp;</p><ul><li>Second</li></ul></td>",
          "<td><br><p>Third</p></td>",
          "</tr>",
          "</table>",
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = result.html;

    const cells = wrapper.querySelectorAll("td");
    expect(cells).toHaveLength(3);
    expect(cells[0].firstElementChild?.textContent?.trim()).toBe("First");
    expect(cells[1].firstElementChild?.tagName).toBe("UL");
    expect(cells[2].firstElementChild?.textContent?.trim()).toBe("Third");
    for (const cell of Array.from(cells)) {
      expect(cell.getAttribute("valign")).toBe("top");
    }

    const emptyParagraphs = Array.from(wrapper.querySelectorAll("td p")).filter(
      (paragraph) =>
        !paragraph.textContent || paragraph.textContent.replace(/[\s\u00a0]/g, "") === ""
    );
    expect(emptyParagraphs).toHaveLength(0);
    expect(wrapper.querySelectorAll("td br")).toHaveLength(0);
  });

  it("maps Google Docs class styles to emphasis classes", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><head>",
          "<style>",
          ".c1{font-weight:700;font-style:italic;text-decoration:underline;}",
          ".c2{margin-left:36pt;}",
          "</style>",
          "</head><body>",
          '<div id="contents">',
          '<p><span class="c1">Styled</span></p>',
          '<p class="c2">Indented</p>',
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain("doc-bold");
    expect(result.html).toContain("doc-italic");
    expect(result.html).toContain("doc-underline");
    expect(result.html).toContain("doc-indent-2");
    expect(result.html).not.toContain("<style");
  });

  it("maps inline indentation styles to doc indent classes", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          '<p style="margin-left:24px">Indented</p>',
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain("doc-indent-1");
    expect(result.html).not.toContain("margin-left");
    expect(result.html).not.toContain("style=");
  });

  it("preserves ordered list start and item value attributes", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          '<ol start="3">',
          '<li value="3">Week 3</li>',
          "</ol>",
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain('ol start="3"');
    expect(result.html).toContain('li value="3"');
  });

  it("preserves in-page anchors and removes empty links", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          '<a id="h.anchor"></a>',
          '<p><a href="#h.anchor">Jump</a></p>',
          '<p><a href="https://example.com">&nbsp;</a></p>',
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain('id="h.anchor"');
    expect(result.html).toContain('href="#h.anchor"');
    expect(result.html).not.toContain('target="_blank"');
    expect(result.html).not.toContain('rel="noopener');
    expect(result.html).not.toContain('href="https://example.com"');
  });

  it("normalizes heading order and drops empty headings", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          "<h4>Section One</h4>",
          "<h3>Subsection</h3>",
          "<h2> </h2>",
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);

    expect(result.html).toContain("<h2>Section One</h2>");
    expect(result.html).toContain("<h3>Subsection</h3>");
    expect(result.html).not.toContain("<h2> </h2>");
  });

  it("ensures h1 headings render as bold", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          "<p>Intro</p>",
          "<h1>Step 3: Make Initial Contact</h1>",
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = result.html;

    const heading = wrapper.querySelector("h1");
    expect(heading).not.toBeNull();
    expect(heading?.classList.contains("doc-bold")).toBe(true);
  });

  it("adds target/rel only for external links", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          '<p><a href="https://example.com">External</a></p>',
          '<p><a href="//example.com">Protocol</a></p>',
          '<p><a href="#section">In-page</a></p>',
          '<p><a href="/relative">Relative</a></p>',
          '<p><a href="mailto:test@example.com">Mail</a></p>',
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = result.html;

    const external = wrapper.querySelector('a[href="https://example.com"]');
    const protocol = wrapper.querySelector('a[href="//example.com"]');
    const inPage = wrapper.querySelector('a[href="#section"]');
    const relative = wrapper.querySelector('a[href="/relative"]');
    const mail = wrapper.querySelector('a[href="mailto:test@example.com"]');

    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(protocol).toHaveAttribute("target", "_blank");
    expect(protocol).toHaveAttribute("rel", "noopener noreferrer");
    expect(inPage).not.toHaveAttribute("target");
    expect(inPage).not.toHaveAttribute("rel");
    expect(relative).not.toHaveAttribute("target");
    expect(relative).not.toHaveAttribute("rel");
    expect(mail).not.toHaveAttribute("target");
    expect(mail).not.toHaveAttribute("rel");
  });

  it("rewrites lesson doc links when a doc map is provided", async () => {
    process.env.APP_ENV = "preview";
    fetchMock.mockResolvedValueOnce(
      new Response(
        [
          "<html><body>",
          '<div id="contents">',
          '<p><a href="https://docs.google.com/document/d/doc-123/edit">Lesson</a></p>',
          "</div>",
          "</body></html>",
        ].join(""),
        { status: 200 }
      )
    );

    const result = await fetchLessonContent(lesson, {
      docIdMap: new Map([["doc-123", "target-slug"]]),
    });
    const wrapper = document.createElement("div");
    wrapper.innerHTML = result.html;

    const link = wrapper.querySelector("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/lesson/target-slug");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });
});
