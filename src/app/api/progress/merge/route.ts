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

const progressMergeSchema = z
  .object({
    lessonSlugs: z.array(z.string()).min(1).max(200),
  })
  .strict();

/**
 * POST /api/progress/merge: merge guest progress into the user account.
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  const logRequest = (
    level: "info" | "warn" | "error",
    details: Record<string, unknown>
  ) => {
    logger[level]("progress.merge", {
      requestId,
      route: "POST /api/progress/merge",
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
    "progress-merge",
    user.id
  );
  if (rateLimitResponse) {
    logRequest("warn", { status: rateLimitResponse.status, reason: "rate_limited" });
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody(request, progressMergeSchema, {
    maxBytes: 32_768,
  });
  if ("error" in parsedBody) {
    logRequest("warn", { status: parsedBody.error.status, reason: "invalid_payload" });
    return parsedBody.error;
  }

  const lessonSlugs = Array.from(
    new Set(parsedBody.data.lessonSlugs.map((slug) => slug.trim()).filter(Boolean))
  );

  if (lessonSlugs.length === 0) {
    logRequest("warn", { status: 400, reason: "no_valid_lessons" });
    return NextResponse.json({ error: "No valid lessons to merge." }, { status: 400 });
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
    logRequest("warn", { status: 400, reason: "no_valid_lessons" });
    return NextResponse.json({ error: "No valid lessons to merge." }, { status: 400 });
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
    status: 200,
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
