import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { tooManyRequestsResponse } from "@/lib/api-helpers";
import { getEnv, requireEnv } from "@/lib/env";
import { HTTP_HEADER } from "@/lib/http-constants";
import { logger } from "@/lib/logger";

const env = getEnv();
const shouldRateLimit = env.isPreview || env.isProduction;

if (shouldRateLimit) {
  requireEnv(env.UPSTASH_REDIS_REST_URL, "UPSTASH_REDIS_REST_URL");
  requireEnv(env.UPSTASH_REDIS_REST_TOKEN, "UPSTASH_REDIS_REST_TOKEN");
}

const redis = shouldRateLimit ? Redis.fromEnv() : null;

/**
 * Named rate-limit buckets used across API routes.
 */
export const RATE_LIMIT_BUCKET = {
  CLIENT_ERROR: "client-error",
  FOCUS_READ: "focus-read",
  FOCUS_WRITE: "focus-write",
  PROGRESS_READ: "progress-read",
  PROGRESS_WRITE: "progress-write",
  PROGRESS_MERGE: "progress-merge",
  LESSON_CONTENT: "lesson-content",
} as const;

export type RateLimitBucket = (typeof RATE_LIMIT_BUCKET)[keyof typeof RATE_LIMIT_BUCKET];

const RATE_LIMIT_WINDOW = "1 m";
const RATE_LIMIT_LIMITS: Record<RateLimitBucket, number> = {
  [RATE_LIMIT_BUCKET.CLIENT_ERROR]: 30,
  [RATE_LIMIT_BUCKET.FOCUS_READ]: 60,
  [RATE_LIMIT_BUCKET.FOCUS_WRITE]: 30,
  [RATE_LIMIT_BUCKET.PROGRESS_READ]: 60,
  [RATE_LIMIT_BUCKET.PROGRESS_WRITE]: 30,
  [RATE_LIMIT_BUCKET.PROGRESS_MERGE]: 10,
  [RATE_LIMIT_BUCKET.LESSON_CONTENT]: 30,
};

const RATE_LIMIT_PREFIXES: Record<RateLimitBucket, string> = {
  [RATE_LIMIT_BUCKET.CLIENT_ERROR]: "ratelimit:client-error",
  [RATE_LIMIT_BUCKET.FOCUS_READ]: "ratelimit:focus-read",
  [RATE_LIMIT_BUCKET.FOCUS_WRITE]: "ratelimit:focus-write",
  [RATE_LIMIT_BUCKET.PROGRESS_READ]: "ratelimit:progress-read",
  [RATE_LIMIT_BUCKET.PROGRESS_WRITE]: "ratelimit:progress-write",
  [RATE_LIMIT_BUCKET.PROGRESS_MERGE]: "ratelimit:progress-merge",
  [RATE_LIMIT_BUCKET.LESSON_CONTENT]: "ratelimit:lesson-content",
};

const RATE_LIMIT_ANONYMOUS_KEY = "anonymous";

const limiterConfigs: Record<
  RateLimitBucket,
  { prefix: string; limiter: ReturnType<typeof Ratelimit.slidingWindow> }
> = {
  [RATE_LIMIT_BUCKET.CLIENT_ERROR]: {
    prefix: RATE_LIMIT_PREFIXES[RATE_LIMIT_BUCKET.CLIENT_ERROR],
    limiter: Ratelimit.slidingWindow(
      RATE_LIMIT_LIMITS[RATE_LIMIT_BUCKET.CLIENT_ERROR],
      RATE_LIMIT_WINDOW
    ),
  },
  [RATE_LIMIT_BUCKET.FOCUS_READ]: {
    prefix: RATE_LIMIT_PREFIXES[RATE_LIMIT_BUCKET.FOCUS_READ],
    limiter: Ratelimit.slidingWindow(
      RATE_LIMIT_LIMITS[RATE_LIMIT_BUCKET.FOCUS_READ],
      RATE_LIMIT_WINDOW
    ),
  },
  [RATE_LIMIT_BUCKET.FOCUS_WRITE]: {
    prefix: RATE_LIMIT_PREFIXES[RATE_LIMIT_BUCKET.FOCUS_WRITE],
    limiter: Ratelimit.slidingWindow(
      RATE_LIMIT_LIMITS[RATE_LIMIT_BUCKET.FOCUS_WRITE],
      RATE_LIMIT_WINDOW
    ),
  },
  [RATE_LIMIT_BUCKET.PROGRESS_READ]: {
    prefix: RATE_LIMIT_PREFIXES[RATE_LIMIT_BUCKET.PROGRESS_READ],
    limiter: Ratelimit.slidingWindow(
      RATE_LIMIT_LIMITS[RATE_LIMIT_BUCKET.PROGRESS_READ],
      RATE_LIMIT_WINDOW
    ),
  },
  [RATE_LIMIT_BUCKET.PROGRESS_WRITE]: {
    prefix: RATE_LIMIT_PREFIXES[RATE_LIMIT_BUCKET.PROGRESS_WRITE],
    limiter: Ratelimit.slidingWindow(
      RATE_LIMIT_LIMITS[RATE_LIMIT_BUCKET.PROGRESS_WRITE],
      RATE_LIMIT_WINDOW
    ),
  },
  [RATE_LIMIT_BUCKET.PROGRESS_MERGE]: {
    prefix: RATE_LIMIT_PREFIXES[RATE_LIMIT_BUCKET.PROGRESS_MERGE],
    limiter: Ratelimit.slidingWindow(
      RATE_LIMIT_LIMITS[RATE_LIMIT_BUCKET.PROGRESS_MERGE],
      RATE_LIMIT_WINDOW
    ),
  },
  [RATE_LIMIT_BUCKET.LESSON_CONTENT]: {
    prefix: RATE_LIMIT_PREFIXES[RATE_LIMIT_BUCKET.LESSON_CONTENT],
    limiter: Ratelimit.slidingWindow(
      RATE_LIMIT_LIMITS[RATE_LIMIT_BUCKET.LESSON_CONTENT],
      RATE_LIMIT_WINDOW
    ),
  },
};

const limiterCache = new Map<RateLimitBucket, Ratelimit>();
const missingIpWarnings = new Set<RateLimitBucket>();

/**
 * Lazily create and cache a rate limiter per bucket.
 */
const getLimiter = (bucket: RateLimitBucket) => {
  if (!redis) {
    return null;
  }

  const cached = limiterCache.get(bucket);
  if (cached) {
    return cached;
  }

  const config = limiterConfigs[bucket];
  const limiter = new Ratelimit({
    redis,
    limiter: config.limiter,
    analytics: true,
    prefix: config.prefix,
  });

  limiterCache.set(bucket, limiter);
  return limiter;
};

/**
 * Resolve the client IP address from common proxy headers.
 */
const getClientIp = (request: Request) => {
  const forwardedFor = request.headers.get(HTTP_HEADER.X_FORWARDED_FOR);
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return (
    request.headers.get(HTTP_HEADER.X_REAL_IP) ??
    request.headers.get(HTTP_HEADER.X_VERCEL_FORWARDED_FOR) ??
    request.headers.get(HTTP_HEADER.X_CLIENT_IP) ??
    null
  );
};

/**
 * Enforce rate limiting for a request and return a response on violation.
 *
 * Only active in preview/production and keys by identifier or client IP.
 */
export const enforceRateLimit = async (
  request: Request,
  bucket: RateLimitBucket,
  identifier?: string | null
) => {
  if (!shouldRateLimit) {
    return null;
  }

  const limiter = getLimiter(bucket);
  if (!limiter) {
    return null;
  }

  const trimmedIdentifier = identifier?.trim();
  const clientIp = trimmedIdentifier ? null : getClientIp(request);
  if (!trimmedIdentifier && !clientIp && !missingIpWarnings.has(bucket)) {
    missingIpWarnings.add(bucket);
    logger.warn("rate_limit.client_ip_missing", {
      bucket,
      note: "Rate limiting relies on client IP; missing IP will use a shared anonymous key and may trigger spikes.",
    });
  }

  const key = trimmedIdentifier || clientIp || RATE_LIMIT_ANONYMOUS_KEY;
  const result = await limiter.limit(key);

  if (result.success) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));

  return tooManyRequestsResponse(retryAfterSeconds);
};
