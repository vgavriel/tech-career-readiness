import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/api-helpers";
import { getEnv } from "@/lib/env";
import { ERROR_MESSAGE } from "@/lib/http-constants";
import { fetchLessonContent } from "@/lib/lesson-content";
import { LESSON_CONTENT_CACHE_TTL_MS } from "@/lib/lesson-content/cache";
import { getLessonDocLinkMap } from "@/lib/lesson-doc-link-map";
import { LOG_CACHE, LOG_EVENT, LOG_REASON, LOG_ROUTE } from "@/lib/log-constants";
import { createRequestLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, RATE_LIMIT_BUCKET } from "@/lib/rate-limit";
import { resolveRequestId } from "@/lib/request-id";

/**
 * Interpret truthy query flags from string values.
 */
const isTruthy = (value: string | null) => value === "1" || value === "true";

/**
 * Determine whether to bypass cache in development requests.
 */
const shouldBypassCache = (searchParams: URLSearchParams, env: ReturnType<typeof getEnv>) =>
  env.isLocal && isTruthy(searchParams.get("bypassCache"));

const buildCacheControl = () => {
  const maxAgeSeconds = Math.max(1, Math.floor(LESSON_CONTENT_CACHE_TTL_MS / 1000));
  const staleSeconds = Math.max(60, Math.floor(maxAgeSeconds / 6));
  return `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${staleSeconds}`;
};

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const lessonQuerySchema = z
  .object({
    lessonId: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
  })
  .refine((data) => Boolean(data.lessonId || data.slug), {
    message: ERROR_MESSAGE.MISSING_LESSON_IDENTIFIER,
  });

/**
 * GET /api/lesson-content: fetch sanitized lesson HTML by lesson id or slug.
 */
export async function GET(request: Request) {
  const env = getEnv();
  const requestId = resolveRequestId(request);
  const logRequest = createRequestLogger({
    event: LOG_EVENT.LESSON_CONTENT_REQUEST,
    route: LOG_ROUTE.LESSON_CONTENT,
    requestId,
  });

  const rateLimitResponse = await enforceRateLimit(request, RATE_LIMIT_BUCKET.LESSON_CONTENT, null);
  if (rateLimitResponse) {
    rateLimitResponse.headers.set("Cache-Control", "no-store");
    logRequest("warn", {
      status: rateLimitResponse.status,
      reason: LOG_REASON.RATE_LIMITED,
    });
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const bypassCache = shouldBypassCache(searchParams, env);
  const parsedQuery = lessonQuerySchema.safeParse({
    lessonId: searchParams.get("lessonId") ?? undefined,
    slug: searchParams.get("slug") ?? undefined,
  });
  if (!parsedQuery.success) {
    logRequest("warn", {
      status: StatusCodes.BAD_REQUEST,
      reason: LOG_REASON.INVALID_QUERY,
    });
    return errorResponse(ERROR_MESSAGE.MISSING_LESSON_IDENTIFIER, StatusCodes.BAD_REQUEST, {
      headers: NO_STORE_HEADERS,
    });
  }

  const { lessonId, slug } = parsedQuery.data;

  let lesson = await prisma.lesson.findFirst({
    where: lessonId ? { id: lessonId, isArchived: false } : { slug: slug ?? "", isArchived: false },
    select: {
      id: true,
      publishedUrl: true,
    },
  });

  if (!lesson && slug) {
    const alias = await prisma.lessonSlugAlias.findUnique({
      where: { slug },
      select: {
        lesson: {
          select: {
            id: true,
            publishedUrl: true,
            isArchived: true,
          },
        },
      },
    });
    if (alias?.lesson && !alias.lesson.isArchived) {
      lesson = {
        id: alias.lesson.id,
        publishedUrl: alias.lesson.publishedUrl,
      };
    }
  }

  if (!lesson) {
    logRequest("warn", {
      status: StatusCodes.NOT_FOUND,
      lessonId,
      slug,
      reason: LOG_REASON.LESSON_NOT_FOUND,
    });
    return errorResponse(ERROR_MESSAGE.LESSON_NOT_FOUND, StatusCodes.NOT_FOUND, {
      headers: NO_STORE_HEADERS,
    });
  }

  try {
    const lessonDocLinkMap = await getLessonDocLinkMap({ bypassCache });
    const content = await fetchLessonContent(lesson, {
      bypassCache,
      docIdMap: lessonDocLinkMap,
      logErrors: false,
    });
    logRequest("info", {
      status: StatusCodes.OK,
      lessonId: lesson.id,
      slug,
      bypassCache,
      cache: content.cached ? LOG_CACHE.HIT : LOG_CACHE.MISS,
    });
    const response = NextResponse.json(content);
    if (env.isPreview || env.isProduction) {
      response.headers.set("Cache-Control", buildCacheControl());
    } else {
      response.headers.set("Cache-Control", "no-store");
    }
    return response;
  } catch (error) {
    logRequest("error", {
      status: StatusCodes.BAD_GATEWAY,
      lessonId: lesson.id,
      slug,
      bypassCache,
      cache: LOG_CACHE.MISS,
      error,
    });
    return errorResponse(ERROR_MESSAGE.LESSON_CONTENT_FETCH_FAILED, StatusCodes.BAD_GATEWAY, {
      headers: NO_STORE_HEADERS,
    });
  }
}
