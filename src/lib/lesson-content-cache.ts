/**
 * In-memory cache entry for sanitized lesson HTML.
 */
type LessonContentCacheEntry = {
  html: string;
  expiresAt: number;
};

const lessonContentCache = new Map<string, LessonContentCacheEntry>();

export const LESSON_CONTENT_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Return cached lesson HTML if present and not expired.
 */
export const getLessonContentCache = (lessonId: string, now = Date.now()) => {
  const entry = lessonContentCache.get(lessonId);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= now) {
    lessonContentCache.delete(lessonId);
    return null;
  }

  return entry.html;
};

/**
 * Store sanitized lesson HTML in the cache with a TTL.
 */
export const setLessonContentCache = (
  lessonId: string,
  html: string,
  ttlMs = LESSON_CONTENT_CACHE_TTL_MS,
  now = Date.now()
) => {
  lessonContentCache.set(lessonId, {
    html,
    expiresAt: now + ttlMs,
  });
};

/**
 * Clear all cached lesson HTML entries.
 */
export const clearLessonContentCache = () => {
  lessonContentCache.clear();
};
