import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ProgressMergeEntry = {
  lessonId?: string;
  completedAt?: string;
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

const parseCompletedAt = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await parsePayload(request);
  const entries = Array.isArray(payload?.entries) ? payload?.entries : [];

  const normalizedEntries = entries
    .map((entry) => {
      const rawLessonId =
        typeof entry?.lessonId === "string" ? entry.lessonId.trim() : "";
      const completedAt =
        typeof entry?.completedAt === "string"
          ? parseCompletedAt(entry.completedAt)
          : null;

      return {
        lessonId: rawLessonId,
        completedAt,
      };
    })
    .filter((entry) => entry.lessonId.length > 0);

  if (normalizedEntries.length === 0) {
    return NextResponse.json({ error: "No progress entries provided." }, { status: 400 });
  }

  const uniqueLessonIds = Array.from(
    new Set(normalizedEntries.map((entry) => entry.lessonId))
  );

  const lessons = await prisma.lesson.findMany({
    where: { id: { in: uniqueLessonIds } },
    select: { id: true },
  });

  const validLessonIds = new Set(lessons.map((lesson) => lesson.id));
  const entriesToMerge = normalizedEntries.filter((entry) =>
    validLessonIds.has(entry.lessonId)
  );

  if (entriesToMerge.length === 0) {
    return NextResponse.json({ error: "No valid lessons to merge." }, { status: 400 });
  }

  const now = new Date();

  await prisma.$transaction(
    entriesToMerge.map((entry) =>
      prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: entry.lessonId,
          },
        },
        create: {
          userId: user.id,
          lessonId: entry.lessonId,
          completedAt: entry.completedAt ?? now,
        },
        update: {
          completedAt: entry.completedAt ?? now,
        },
      })
    )
  );

  const skippedLessonIds = uniqueLessonIds.filter(
    (lessonId) => !validLessonIds.has(lessonId)
  );

  return NextResponse.json({
    mergedLessonIds: entriesToMerge.map((entry) => entry.lessonId),
    skippedLessonIds,
  });
}
