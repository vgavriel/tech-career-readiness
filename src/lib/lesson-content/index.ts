import { getEnv } from "@/lib/env";
import {
  getLessonContentCache,
  LESSON_CONTENT_CACHE_TTL_MS,
  setLessonContentCache,
} from "@/lib/lesson-content/cache";
import { extractLessonHtml } from "@/lib/lesson-content/extract";
import { assertAllowedLessonUrl, fetchLessonHtml } from "@/lib/lesson-content/fetch";
import { sanitizeLessonHtml } from "@/lib/lesson-content/sanitize";
import { LessonDocIdMap, rewriteLessonDocLinks } from "@/lib/lesson-doc-links";
import { LOG_EVENT } from "@/lib/log-constants";
import { logger } from "@/lib/logger";

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

const lessonContentInFlight = new Map<string, Promise<LessonContentResult>>();

/**
 * Fetch, sanitize, and cache lesson HTML for the given lesson source.
 */
export async function fetchLessonContent(
  lesson: LessonSource,
  options: {
    bypassCache?: boolean;
    docIdMap?: LessonDocIdMap;
    logErrors?: boolean;
  } = {}
): Promise<LessonContentResult> {
  const { bypassCache = false, docIdMap, logErrors = true } = options;
  const env = getEnv();
  const rewriteLinks = (html: string) => (docIdMap ? rewriteLessonDocLinks(html, docIdMap) : html);

  if (!bypassCache) {
    const cachedHtml = await getLessonContentCache(lesson.id);
    if (cachedHtml) {
      const rewrittenHtml = rewriteLinks(cachedHtml);
      if (rewrittenHtml !== cachedHtml) {
        setLessonContentCache(lesson.id, rewrittenHtml, LESSON_CONTENT_CACHE_TTL_MS);
      }
      return { lessonId: lesson.id, html: rewrittenHtml, cached: true };
    }
  }

  if (!bypassCache) {
    const inFlight = lessonContentInFlight.get(lesson.id);
    if (inFlight) {
      return inFlight;
    }
  }

  const fetchPromise = (async () => {
    const validatedUrl = assertAllowedLessonUrl(lesson.publishedUrl);
    const mockHtml = env.LESSON_CONTENT_MOCK_HTML;
    if (mockHtml && (env.isLocal || env.isTest)) {
      const sanitizedHtml = sanitizeLessonHtml(rewriteLinks(mockHtml));
      setLessonContentCache(lesson.id, sanitizedHtml, LESSON_CONTENT_CACHE_TTL_MS);
      return { lessonId: lesson.id, html: sanitizedHtml, cached: false };
    }
    const rawHtml = await fetchLessonHtml(validatedUrl);
    const extractedHtml = extractLessonHtml(rawHtml);
    const sanitizedHtml = sanitizeLessonHtml(rewriteLinks(extractedHtml));
    setLessonContentCache(lesson.id, sanitizedHtml, LESSON_CONTENT_CACHE_TTL_MS);

    return { lessonId: lesson.id, html: sanitizedHtml, cached: false };
  })();

  if (!bypassCache) {
    lessonContentInFlight.set(lesson.id, fetchPromise);
  }

  try {
    return await fetchPromise;
  } catch (error) {
    if (logErrors) {
      logger.error(LOG_EVENT.LESSON_CONTENT_FETCH_FAILED, {
        lessonId: lesson.id,
        publishedUrl: lesson.publishedUrl,
        error,
      });
    }
    throw error;
  } finally {
    if (!bypassCache) {
      lessonContentInFlight.delete(lesson.id);
    }
  }
}
