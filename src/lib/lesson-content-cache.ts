type LessonContentCacheEntry = {
  html: string;
  expiresAt: number;
};

const lessonContentCache = new Map<string, LessonContentCacheEntry>();

export const LESSON_CONTENT_CACHE_TTL_MS = 60 * 60 * 1000;

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

export const clearLessonContentCache = () => {
  lessonContentCache.clear();
};
