import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

import { getEnv, requireEnv } from "@/lib/env";

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
  FOCUS_READ: "focus-read",
  FOCUS_WRITE: "focus-write",
  PROGRESS_READ: "progress-read",
  PROGRESS_WRITE: "progress-write",
  PROGRESS_MERGE: "progress-merge",
  LESSON_CONTENT: "lesson-content",
} as const;

export type RateLimitBucket =
  (typeof RATE_LIMIT_BUCKET)[keyof typeof RATE_LIMIT_BUCKET];

const limiterConfigs: Record<
  RateLimitBucket,
  { prefix: string; limiter: ReturnType<typeof Ratelimit.slidingWindow> }
> = {
  [RATE_LIMIT_BUCKET.FOCUS_READ]: {
    prefix: "ratelimit:focus-read",
    limiter: Ratelimit.slidingWindow(60, "1 m"),
  },
  [RATE_LIMIT_BUCKET.FOCUS_WRITE]: {
    prefix: "ratelimit:focus-write",
    limiter: Ratelimit.slidingWindow(30, "1 m"),
  },
  [RATE_LIMIT_BUCKET.PROGRESS_READ]: {
    prefix: "ratelimit:progress-read",
    limiter: Ratelimit.slidingWindow(60, "1 m"),
  },
  [RATE_LIMIT_BUCKET.PROGRESS_WRITE]: {
    prefix: "ratelimit:progress-write",
    limiter: Ratelimit.slidingWindow(30, "1 m"),
  },
  [RATE_LIMIT_BUCKET.PROGRESS_MERGE]: {
    prefix: "ratelimit:progress-merge",
    limiter: Ratelimit.slidingWindow(10, "1 m"),
  },
  [RATE_LIMIT_BUCKET.LESSON_CONTENT]: {
    prefix: "ratelimit:lesson-content",
    limiter: Ratelimit.slidingWindow(30, "1 m"),
  },
};

const limiterCache = new Map<RateLimitBucket, Ratelimit>();

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
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-client-ip") ??
    null
  );
};

/**
 * Enforce rate limiting for a request and return a response on violation.
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

  const key = identifier?.trim() || getClientIp(request) || "anonymous";
  const result = await limiter.limit(key);

  if (result.success) {
    return null;
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.reset - Date.now()) / 1000)
  );

  return NextResponse.json(
    { error: "Too many requests." },
    {
      status: 429,
      headers: {
        "Retry-After": retryAfterSeconds.toString(),
      },
    }
  );
};
