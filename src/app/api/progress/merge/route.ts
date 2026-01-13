import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { withDbRetry } from "@/lib/db-retry";
import { prisma } from "@/lib/prisma";
import { enforceStateChangeSecurity } from "@/lib/request-guard";

export const runtime = "nodejs";

type ProgressMergeEntry = {
  lessonId?: unknown;
};

type ProgressMergePayload = {
  entries?: ProgressMergeEntry[];
};

const parsePayload = async (request: Request) => {
  try {
    return (await request.json()) as ProgressMergePayload;
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const guardResponse = enforceStateChangeSecurity(request);
  if (guardResponse) {
    return guardResponse;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await parsePayload(request);
  const entries = Array.isArray(payload?.entries) ? payload?.entries : [];

  const normalizedLessonIds = entries
    .map((entry) =>
      typeof entry?.lessonId === "string" ? entry.lessonId.trim() : ""
    )
    .filter((lessonId) => lessonId.length > 0);

  if (normalizedLessonIds.length === 0) {
    return NextResponse.json({ error: "No progress entries provided." }, { status: 400 });
  }

  const uniqueLessonIds = Array.from(new Set(normalizedLessonIds));

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

  const data = validLessonIds.map((lessonId) => ({
    userId: user.id,
    lessonId,
    completedAt: now,
  }));

  await withDbRetry(() =>
    prisma.$transaction([
      prisma.lessonProgress.createMany({
        data,
        skipDuplicates: true,
      }),
      prisma.lessonProgress.updateMany({
        where: {
          userId: user.id,
          lessonId: { in: validLessonIds },
        },
        data: { completedAt: now },
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
