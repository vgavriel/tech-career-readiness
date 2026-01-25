import { LessonProgressAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { errorResponse, parseJsonBody, unauthorizedResponse } from "@/lib/api-helpers";
import { withDbRetry } from "@/lib/db-retry";
import { ERROR_MESSAGE } from "@/lib/http-constants";
import { createRequestLogger } from "@/lib/logger";
import { LOG_EVENT, LOG_REASON, LOG_ROUTE } from "@/lib/log-constants";
import { PROGRESS_MERGE_MAX_BODY_BYTES, PROGRESS_MERGE_MAX_LESSONS } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, RATE_LIMIT_BUCKET } from "@/lib/rate-limit";
import { enforceStateChangeSecurity } from "@/lib/request-guard";
import { resolveRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

const progressMergeSchema = z
  .object({
    lessonSlugs: z.array(z.string()).min(1).max(PROGRESS_MERGE_MAX_LESSONS),
  })
  .strict();

/**
 * POST /api/progress/merge: merge guest progress into the user account.
 */
export async function POST(request: Request) {
  const requestId = resolveRequestId(request);
  const logRequest = createRequestLogger({
    event: LOG_EVENT.PROGRESS_MERGE,
    route: LOG_ROUTE.PROGRESS_MERGE,
    requestId,
  });

  const guardResponse = enforceStateChangeSecurity(request);
  if (guardResponse) {
    logRequest("warn", { status: guardResponse.status, reason: LOG_REASON.BLOCKED });
    return guardResponse;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    logRequest("warn", {
      status: StatusCodes.UNAUTHORIZED,
      reason: LOG_REASON.UNAUTHORIZED,
    });
    return unauthorizedResponse();
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    RATE_LIMIT_BUCKET.PROGRESS_MERGE,
    user.id
  );
  if (rateLimitResponse) {
    logRequest("warn", {
      status: rateLimitResponse.status,
      reason: LOG_REASON.RATE_LIMITED,
    });
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody(request, progressMergeSchema, {
    maxBytes: PROGRESS_MERGE_MAX_BODY_BYTES,
  });
  if ("error" in parsedBody) {
    logRequest("warn", {
      status: parsedBody.error.status,
      reason: LOG_REASON.INVALID_PAYLOAD,
    });
    return parsedBody.error;
  }

  const lessonSlugs = Array.from(
    new Set(parsedBody.data.lessonSlugs.map((slug) => slug.trim()).filter(Boolean))
  );

  if (lessonSlugs.length === 0) {
    logRequest("warn", {
      status: StatusCodes.BAD_REQUEST,
      reason: LOG_REASON.NO_VALID_LESSONS,
    });
    return errorResponse(
      ERROR_MESSAGE.NO_VALID_LESSONS,
      StatusCodes.BAD_REQUEST
    );
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      isArchived: false,
      slug: { in: lessonSlugs },
    },
    select: { id: true, slug: true },
  });

  const validLessonIds = lessons.map((lesson) => lesson.id);
  const validLessonSlugs = lessons.map((lesson) => lesson.slug);
  const validLessonSlugSet = new Set(validLessonSlugs);

  if (validLessonIds.length === 0) {
    logRequest("warn", {
      status: StatusCodes.BAD_REQUEST,
      reason: LOG_REASON.NO_VALID_LESSONS,
    });
    return errorResponse(
      ERROR_MESSAGE.NO_VALID_LESSONS,
      StatusCodes.BAD_REQUEST
    );
  }

  const now = new Date();
  const progressData = validLessonIds.map((lessonId) => ({
    userId: user.id,
    lessonId,
    completedAt: now,
  }));
  const eventData = validLessonIds.map((lessonId) => ({
    userId: user.id,
    lessonId,
    action: LessonProgressAction.completed,
    createdAt: now,
  }));

  await withDbRetry(() =>
    prisma.$transaction([
      prisma.lessonProgress.createMany({
        data: progressData,
        skipDuplicates: true,
      }),
      prisma.lessonProgress.updateMany({
        where: {
          userId: user.id,
          lessonId: { in: validLessonIds },
        },
        data: { completedAt: now },
      }),
      prisma.lessonProgressEvent.createMany({
        data: eventData,
      }),
    ])
  );

  const skippedLessonSlugs = lessonSlugs.filter(
    (lessonSlug) => !validLessonSlugSet.has(lessonSlug)
  );

  logRequest("info", {
    status: StatusCodes.OK,
    requestedCount: lessonSlugs.length,
    mergedCount: validLessonSlugs.length,
    skippedCount: skippedLessonSlugs.length,
    userId: user.id,
  });
  return NextResponse.json({
    mergedLessonSlugs: validLessonSlugs,
    skippedLessonSlugs,
  });
}
