import { LessonProgressAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { parseJsonBody, unauthorizedResponse } from "@/lib/api-helpers";
import { withDbRetry } from "@/lib/db-retry";
import { createRequestLogger } from "@/lib/logger";
import { LOG_EVENT, LOG_REASON, LOG_ROUTE } from "@/lib/log-constants";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, RATE_LIMIT_BUCKET } from "@/lib/rate-limit";
import { enforceStateChangeSecurity } from "@/lib/request-guard";
import { resolveRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

const progressUpdateSchema = z
  .object({
    lessonSlug: z.string().trim().min(1),
    completed: z.boolean(),
  })
  .strict()
  .refine((data) => Boolean(data.lessonSlug), {
    message: "Provide lessonSlug.",
  });

/**
 * GET /api/progress: return completed lesson ids for the current user.
 */
export async function GET(request: Request) {
  const requestId = resolveRequestId(request);
  const logRequest = createRequestLogger({
    event: LOG_EVENT.PROGRESS_READ,
    route: LOG_ROUTE.PROGRESS_READ,
    requestId,
  });

  const user = await getAuthenticatedUser();

  if (!user) {
    logRequest("warn", { status: 401, reason: LOG_REASON.UNAUTHORIZED });
    return unauthorizedResponse();
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    RATE_LIMIT_BUCKET.PROGRESS_READ,
    user.id
  );
  if (rateLimitResponse) {
    logRequest("warn", {
      status: rateLimitResponse.status,
      reason: LOG_REASON.RATE_LIMITED,
    });
    return rateLimitResponse;
  }

  const progress = await prisma.lessonProgress.findMany({
    where: {
      userId: user.id,
      completedAt: { not: null },
      lesson: { isArchived: false },
    },
    select: {
      lesson: {
        select: {
          slug: true,
        },
      },
    },
  });

  logRequest("info", {
    status: 200,
    completedCount: progress.length,
    userId: user.id,
  });
  return NextResponse.json({
    completedLessonSlugs: progress.map((entry) => entry.lesson.slug),
  });
}

/**
 * POST /api/progress: update completion state and record audit events.
 */
export async function POST(request: Request) {
  const requestId = resolveRequestId(request);
  const logRequest = createRequestLogger({
    event: LOG_EVENT.PROGRESS_WRITE,
    route: LOG_ROUTE.PROGRESS_WRITE,
    requestId,
  });

  const guardResponse = enforceStateChangeSecurity(request);
  if (guardResponse) {
    logRequest("warn", { status: guardResponse.status, reason: LOG_REASON.BLOCKED });
    return guardResponse;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    logRequest("warn", { status: 401, reason: LOG_REASON.UNAUTHORIZED });
    return unauthorizedResponse();
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    RATE_LIMIT_BUCKET.PROGRESS_WRITE,
    user.id
  );
  if (rateLimitResponse) {
    logRequest("warn", {
      status: rateLimitResponse.status,
      reason: LOG_REASON.RATE_LIMITED,
    });
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody(request, progressUpdateSchema);
  if ("error" in parsedBody) {
    logRequest("warn", {
      status: parsedBody.error.status,
      reason: LOG_REASON.INVALID_PAYLOAD,
    });
    return parsedBody.error;
  }

  const { lessonSlug, completed } = parsedBody.data;

  const lesson = await prisma.lesson.findFirst({
    where: { slug: lessonSlug, isArchived: false },
    select: { id: true, slug: true },
  });

  if (!lesson) {
    logRequest("warn", {
      status: 404,
      lessonSlug,
      reason: LOG_REASON.LESSON_NOT_FOUND,
    });
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  const now = new Date();
  const action = completed
    ? LessonProgressAction.completed
    : LessonProgressAction.incomplete;

  await withDbRetry(() =>
    prisma.$transaction([
      completed
        ? prisma.lessonProgress.upsert({
            where: {
              userId_lessonId: {
                userId: user.id,
                lessonId: lesson.id,
              },
            },
            create: {
              userId: user.id,
              lessonId: lesson.id,
              completedAt: now,
            },
            update: {
              completedAt: now,
            },
          })
        : prisma.lessonProgress.deleteMany({
            where: {
              userId: user.id,
              lessonId: lesson.id,
            },
          }),
      prisma.lessonProgressEvent.create({
        data: {
          userId: user.id,
          lessonId: lesson.id,
          action,
          createdAt: now,
        },
      }),
    ])
  );

  logRequest("info", {
    status: 200,
    lessonSlug: lesson.slug,
    action,
    userId: user.id,
  });
  return NextResponse.json({ lessonSlug: lesson.slug, completed });
}
