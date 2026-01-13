import { LessonProgressAction } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { parseJsonBody } from "@/lib/api-helpers";
import { withDbRetry } from "@/lib/db-retry";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceStateChangeSecurity } from "@/lib/request-guard";

export const runtime = "nodejs";

const progressMergeSchema = z
  .object({
    entries: z.array(z.unknown()).min(1).max(200),
  })
  .strict();

/**
 * POST /api/progress/merge: merge guest progress into the user account.
 */
export async function POST(request: Request) {
  const guardResponse = enforceStateChangeSecurity(request);
  if (guardResponse) {
    return guardResponse;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    "progress-merge",
    user.id
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody(request, progressMergeSchema, {
    maxBytes: 32_768,
  });
  if ("error" in parsedBody) {
    return parsedBody.error;
  }

  const uniqueLessonIds = Array.from(
    new Set(
      parsedBody.data.entries
        .map((entry) => {
          if (!entry || typeof entry !== "object" || !("lessonId" in entry)) {
            return null;
          }

          const lessonId = (entry as { lessonId?: unknown }).lessonId;
          if (typeof lessonId !== "string") {
            return null;
          }

          const trimmed = lessonId.trim();
          return trimmed.length > 0 ? trimmed : null;
        })
        .filter((lessonId): lessonId is string => Boolean(lessonId))
    )
  );

  if (uniqueLessonIds.length === 0) {
    return NextResponse.json({ error: "No valid lessons to merge." }, { status: 400 });
  }

  const lessons = await prisma.lesson.findMany({
    where: { id: { in: uniqueLessonIds } },
    select: { id: true },
  });

  const validLessonIds = lessons.map((lesson) => lesson.id);
  const validLessonIdSet = new Set(validLessonIds);

  if (validLessonIds.length === 0) {
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

  const skippedLessonIds = uniqueLessonIds.filter(
    (lessonId) => !validLessonIdSet.has(lessonId)
  );

  return NextResponse.json({
    mergedLessonIds: validLessonIds,
    skippedLessonIds,
  });
}
