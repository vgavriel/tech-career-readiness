import { LessonProgressAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { parseJsonBody } from "@/lib/api-helpers";
import { withDbRetry } from "@/lib/db-retry";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceStateChangeSecurity } from "@/lib/request-guard";
import { getRequestId } from "@/lib/request-id";

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
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  const logRequest = (
    level: "info" | "warn" | "error",
    details: Record<string, unknown>
  ) => {
    logger[level]("progress.read", {
      requestId,
      route: "GET /api/progress",
      durationMs: Date.now() - startedAt,
      ...details,
    });
  };

  const user = await getAuthenticatedUser();

  if (!user) {
    logRequest("warn", { status: 401, reason: "unauthorized" });
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    "progress-read",
    user.id
  );
  if (rateLimitResponse) {
    logRequest("warn", { status: rateLimitResponse.status, reason: "rate_limited" });
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
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  const logRequest = (
    level: "info" | "warn" | "error",
    details: Record<string, unknown>
  ) => {
    logger[level]("progress.write", {
      requestId,
      route: "POST /api/progress",
      durationMs: Date.now() - startedAt,
      ...details,
    });
  };

  const guardResponse = enforceStateChangeSecurity(request);
  if (guardResponse) {
    logRequest("warn", { status: guardResponse.status, reason: "blocked" });
    return guardResponse;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    logRequest("warn", { status: 401, reason: "unauthorized" });
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    "progress-write",
    user.id
  );
  if (rateLimitResponse) {
    logRequest("warn", { status: rateLimitResponse.status, reason: "rate_limited" });
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody(request, progressUpdateSchema);
  if ("error" in parsedBody) {
    logRequest("warn", { status: parsedBody.error.status, reason: "invalid_payload" });
    return parsedBody.error;
  }

  const { lessonSlug, completed } = parsedBody.data;

  const lesson = await prisma.lesson.findFirst({
    where: { slug: lessonSlug, isArchived: false },
    select: { id: true, slug: true },
  });

  if (!lesson) {
    logRequest("warn", { status: 404, lessonSlug, reason: "lesson_not_found" });
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
