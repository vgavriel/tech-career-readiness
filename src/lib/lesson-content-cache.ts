import { Redis } from "@upstash/redis";

import { getEnv } from "@/lib/env";

/**
 * In-memory cache entry for sanitized lesson HTML.
 */
type LessonContentCacheEntry = {
  html: string;
  expiresAt: number;
};

const lessonContentCache = new Map<string, LessonContentCacheEntry>();

export const LESSON_CONTENT_CACHE_TTL_MS = 60 * 60 * 1000;
const LESSON_CONTENT_CACHE_VERSION = 3;
const LESSON_CONTENT_CACHE_PREFIX = `lesson-content:v${LESSON_CONTENT_CACHE_VERSION}`;

let redisClient: Redis | null | undefined;

const buildCacheKey = (lessonId: string) =>
  `${LESSON_CONTENT_CACHE_PREFIX}:${lessonId}`;

const getRedisClient = () => {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const env = getEnv();
  const isTestEnv = process.env.NODE_ENV === "test" || env.isTest;
  const shouldUseSharedCache = env.isPreview || env.isProduction;
  const url = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (isTestEnv || !shouldUseSharedCache || !url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = Redis.fromEnv();
  return redisClient;
};

/**
 * Return cached lesson HTML if present and not expired.
 */
export const getLessonContentCache = async (
  lessonId: string,
  now = Date.now()
) => {
  const cacheKey = buildCacheKey(lessonId);
  const entry = lessonContentCache.get(cacheKey);
  if (entry) {
    if (entry.expiresAt > now) {
      return entry.html;
    }
    lessonContentCache.delete(cacheKey);
  }

  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const cached = await redis.get<string>(buildCacheKey(lessonId));
    if (typeof cached === "string") {
      lessonContentCache.set(cacheKey, {
        html: cached,
        expiresAt: now + LESSON_CONTENT_CACHE_TTL_MS,
      });
      return cached;
    }
  } catch {
    return null;
  }

  return null;
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
  const cacheKey = buildCacheKey(lessonId);
  lessonContentCache.set(cacheKey, {
    html,
    expiresAt: now + ttlMs,
  });

  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
  void redis.set(buildCacheKey(lessonId), html, { ex: ttlSeconds }).catch(() => {});
};

/**
 * Clear all cached lesson HTML entries.
 */
export const clearLessonContentCache = () => {
  lessonContentCache.clear();
};
