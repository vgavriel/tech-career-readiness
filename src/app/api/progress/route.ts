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

const progressUpdateSchema = z
  .object({
    lessonId: z.string().trim().min(1),
    completed: z.boolean(),
  })
  .strict();

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    "progress-read",
    user.id
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const progress = await prisma.lessonProgress.findMany({
    where: {
      userId: user.id,
      completedAt: { not: null },
    },
    select: {
      lessonId: true,
    },
  });

  return NextResponse.json({
    completedLessonIds: progress.map((entry) => entry.lessonId),
  });
}

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
    "progress-write",
    user.id
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody(request, progressUpdateSchema);
  if ("error" in parsedBody) {
    return parsedBody.error;
  }

  const { lessonId, completed } = parsedBody.data;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true },
  });

  if (!lesson) {
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
                lessonId,
              },
            },
            create: {
              userId: user.id,
              lessonId,
              completedAt: now,
            },
            update: {
              completedAt: now,
            },
          })
        : prisma.lessonProgress.deleteMany({
            where: {
              userId: user.id,
              lessonId,
            },
          }),
      prisma.lessonProgressEvent.create({
        data: {
          userId: user.id,
          lessonId,
          action,
          createdAt: now,
        },
      }),
    ])
  );

  return NextResponse.json({ lessonId, completed });
}
