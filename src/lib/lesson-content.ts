import sanitizeHtml from "sanitize-html";

import {
  LESSON_CONTENT_CACHE_TTL_MS,
  getLessonContentCache,
  setLessonContentCache,
} from "@/lib/lesson-content-cache";

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

type LessonSource = {
  id: string;
  publishedUrl: string;
};

export type LessonContentResult = {
  lessonId: string;
  html: string;
  cached: boolean;
};

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

  let response: Response;
  try {
    response = await fetch(lesson.publishedUrl, { cache: "no-store" });
  } catch {
    throw new Error("Failed to fetch lesson content.");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch lesson content.");
  }

  const rawHtml = await response.text();
  const sanitizedHtml = sanitizeHtml(rawHtml, sanitizeOptions);
  setLessonContentCache(lesson.id, sanitizedHtml, LESSON_CONTENT_CACHE_TTL_MS);

  return { lessonId: lesson.id, html: sanitizedHtml, cached: false };
}
