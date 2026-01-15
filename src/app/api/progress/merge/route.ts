import { LessonProgressAction, Prisma } from "@prisma/client";
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

  const lessonKeySet = new Set<string>();
  const lessonIdSet = new Set<string>();

  parsedBody.data.entries.forEach((entry) => {
    if (!entry || typeof entry !== "object") {
      return;
    }

    const payload = entry as { lessonKey?: unknown; lessonId?: unknown };
    const lessonKey =
      typeof payload.lessonKey === "string" ? payload.lessonKey.trim() : "";
    if (lessonKey) {
      lessonKeySet.add(lessonKey);
    }

    const lessonId =
      typeof payload.lessonId === "string" ? payload.lessonId.trim() : "";
    if (lessonId) {
      lessonIdSet.add(lessonId);
    }
  });

  const lessonKeys = Array.from(lessonKeySet);
  const lessonIds = Array.from(lessonIdSet);

  if (lessonKeys.length === 0 && lessonIds.length === 0) {
    return NextResponse.json({ error: "No valid lessons to merge." }, { status: 400 });
  }

  const lessonFilters: Prisma.LessonWhereInput[] = [];
  if (lessonKeys.length > 0) {
    lessonFilters.push({ key: { in: lessonKeys } });
  }
  if (lessonIds.length > 0) {
    lessonFilters.push({ id: { in: lessonIds } });
  }

  const lessons = await prisma.lesson.findMany({
    where: {
      isArchived: false,
      OR: lessonFilters,
    },
    select: { id: true, key: true },
  });

  const validLessonIds = lessons.map((lesson) => lesson.id);
  const validLessonKeys = lessons.map((lesson) => lesson.key);
  const validLessonIdSet = new Set(validLessonIds);
  const validLessonKeySet = new Set(validLessonKeys);

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

  const skippedLessonKeys = lessonKeys.filter(
    (lessonKey) => !validLessonKeySet.has(lessonKey)
  );
  const skippedLessonIds = lessonIds.filter(
    (lessonId) => !validLessonIdSet.has(lessonId)
  );

  return NextResponse.json({
    mergedLessonKeys: validLessonKeys,
    skippedLessonKeys,
    skippedLessonIds,
  });
}
