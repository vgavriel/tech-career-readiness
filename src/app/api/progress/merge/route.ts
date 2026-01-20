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
    lessonSlugs: z.array(z.string()).min(1).max(200),
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

  const lessonSlugs = Array.from(
    new Set(parsedBody.data.lessonSlugs.map((slug) => slug.trim()).filter(Boolean))
  );

  if (lessonSlugs.length === 0) {
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

  return NextResponse.json({
    mergedLessonSlugs: validLessonSlugs,
    skippedLessonSlugs,
  });
}
