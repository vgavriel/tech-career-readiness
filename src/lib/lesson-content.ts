import sanitizeHtml from "sanitize-html";

import {
  LESSON_CONTENT_CACHE_TTL_MS,
  getLessonContentCache,
  setLessonContentCache,
} from "@/lib/lesson-content-cache";

const allowedLessonHosts = new Set(["docs.google.com", "drive.google.com"]);

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags,
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["class", "style"],
    a: ["href", "name", "target", "rel"],
    table: ["class", "style", "border", "cellpadding", "cellspacing", "width"],
    thead: ["class", "style"],
    tbody: ["class", "style"],
    tfoot: ["class", "style"],
    tr: ["class", "style"],
    th: ["class", "style", "colspan", "rowspan", "scope", "width", "height"],
    td: ["class", "style", "colspan", "rowspan", "width", "height"],
    colgroup: ["class", "style", "span", "width"],
    col: ["class", "style", "span", "width"],
  },
};

/**
 * Minimal lesson data required to fetch content.
 */
type LessonSource = {
  id: string;
  publishedUrl: string;
};

/**
 * Result of fetching lesson content with cache metadata.
 */
export type LessonContentResult = {
  lessonId: string;
  html: string;
  cached: boolean;
};

/**
 * Validate and return the lesson URL, enforcing the allowlist.
 */
const assertAllowedLessonUrl = (publishedUrl: string) => {
  let url: URL;

  try {
    url = new URL(publishedUrl);
  } catch {
    throw new Error("Lesson URL is invalid.");
  }

  if (url.protocol !== "https:" || !allowedLessonHosts.has(url.hostname)) {
    throw new Error("Lesson URL is not allowed.");
  }

  return url;
};

/**
 * Fetch published lesson HTML, following safe redirects up to the limit.
 */
const fetchLessonHtml = async (url: URL, maxRedirects = 3) => {
  let currentUrl = url;

  for (let attempt = 0; attempt <= maxRedirects; attempt += 1) {
    const response = await fetch(currentUrl.toString(), {
      cache: "no-store",
      redirect: "manual",
    });

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.get("location")
    ) {
      const redirectUrl = new URL(response.headers.get("location") ?? "", currentUrl);
      if (
        redirectUrl.protocol !== "https:" ||
        !allowedLessonHosts.has(redirectUrl.hostname)
      ) {
        throw new Error("Lesson URL is not allowed.");
      }

      currentUrl = redirectUrl;
      continue;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch lesson content.");
    }

    return response.text();
  }

  throw new Error("Too many redirects while fetching lesson content.");
};

/**
 * Fetch, sanitize, and cache lesson HTML for the given lesson source.
 */
export async function fetchLessonContent(
  lesson: LessonSource,
  options: { bypassCache?: boolean } = {}
): Promise<LessonContentResult> {
  const { bypassCache = false } = options;

  if (!bypassCache) {
    const cachedHtml = getLessonContentCache(lesson.id);
    if (cachedHtml) {
      return { lessonId: lesson.id, html: cachedHtml, cached: true };
    }
  }

  const mockHtml = process.env.LESSON_CONTENT_MOCK_HTML;
  if (mockHtml) {
    const sanitizedHtml = sanitizeHtml(mockHtml, sanitizeOptions);
    setLessonContentCache(lesson.id, sanitizedHtml, LESSON_CONTENT_CACHE_TTL_MS);
    return { lessonId: lesson.id, html: sanitizedHtml, cached: false };
  }

  const validatedUrl = assertAllowedLessonUrl(lesson.publishedUrl);
  const rawHtml = await fetchLessonHtml(validatedUrl);
  const sanitizedHtml = sanitizeHtml(rawHtml, sanitizeOptions);
  setLessonContentCache(lesson.id, sanitizedHtml, LESSON_CONTENT_CACHE_TTL_MS);

  return { lessonId: lesson.id, html: sanitizedHtml, cached: false };
}
