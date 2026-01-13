import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

type RateLimitBucket =
  | "progress-read"
  | "progress-write"
  | "progress-merge"
  | "lesson-content";

const limiterConfigs: Record<
  RateLimitBucket,
  { prefix: string; limiter: ReturnType<typeof Ratelimit.slidingWindow> }
> = {
  "progress-read": {
    prefix: "ratelimit:progress-read",
    limiter: Ratelimit.slidingWindow(60, "1 m"),
  },
  "progress-write": {
    prefix: "ratelimit:progress-write",
    limiter: Ratelimit.slidingWindow(30, "1 m"),
  },
  "progress-merge": {
    prefix: "ratelimit:progress-merge",
    limiter: Ratelimit.slidingWindow(10, "1 m"),
  },
  "lesson-content": {
    prefix: "ratelimit:lesson-content",
    limiter: Ratelimit.slidingWindow(30, "1 m"),
  },
};

const limiterCache = new Map<RateLimitBucket, Ratelimit>();

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

export const enforceRateLimit = async (
  request: Request,
  bucket: RateLimitBucket,
  identifier?: string | null
) => {
  if (process.env.NODE_ENV === "test") {
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
