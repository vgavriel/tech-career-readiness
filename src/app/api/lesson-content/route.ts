import { NextResponse } from "next/server";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

import { errorResponse } from "@/lib/api-helpers";
import { fetchLessonContent } from "@/lib/lesson-content";
import { getLessonDocLinkMap } from "@/lib/lesson-doc-link-map";
import { getEnv } from "@/lib/env";
import { ERROR_MESSAGE } from "@/lib/http-constants";
import { createRequestLogger } from "@/lib/logger";
import { LOG_CACHE, LOG_EVENT, LOG_REASON, LOG_ROUTE } from "@/lib/log-constants";
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
const shouldBypassCache = (searchParams: URLSearchParams) => {
  const env = getEnv();
  if (!env.isLocal) {
    return false;
  }

  return isTruthy(searchParams.get("bypassCache"));
};

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
  const requestId = resolveRequestId(request);
  const logRequest = createRequestLogger({
    event: LOG_EVENT.LESSON_CONTENT_REQUEST,
    route: LOG_ROUTE.LESSON_CONTENT,
    requestId,
  });

  const rateLimitResponse = await enforceRateLimit(
    request,
    RATE_LIMIT_BUCKET.LESSON_CONTENT,
    null
  );
  if (rateLimitResponse) {
    logRequest("warn", {
      status: rateLimitResponse.status,
      reason: LOG_REASON.RATE_LIMITED,
    });
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const bypassCache = shouldBypassCache(searchParams);
  const parsedQuery = lessonQuerySchema.safeParse({
    lessonId: searchParams.get("lessonId") ?? undefined,
    slug: searchParams.get("slug") ?? undefined,
  });
  if (!parsedQuery.success) {
    logRequest("warn", {
      status: StatusCodes.BAD_REQUEST,
      reason: LOG_REASON.INVALID_QUERY,
    });
    return errorResponse(
      ERROR_MESSAGE.MISSING_LESSON_IDENTIFIER,
      StatusCodes.BAD_REQUEST
    );
  }

  const { lessonId, slug } = parsedQuery.data;

  let lesson = await prisma.lesson.findFirst({
    where: lessonId
      ? { id: lessonId, isArchived: false }
      : { slug: slug ?? "", isArchived: false },
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
    return errorResponse(ERROR_MESSAGE.LESSON_NOT_FOUND, StatusCodes.NOT_FOUND);
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
    return NextResponse.json(content);
  } catch (error) {
    logRequest("error", {
      status: StatusCodes.BAD_GATEWAY,
      lessonId: lesson.id,
      slug,
      bypassCache,
      cache: LOG_CACHE.MISS,
      error,
    });
    return errorResponse(
      ERROR_MESSAGE.LESSON_CONTENT_FETCH_FAILED,
      StatusCodes.BAD_GATEWAY
    );
  }
}
