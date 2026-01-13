import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ProgressUpdatePayload = {
  lessonId?: string;
  completed?: boolean;
};

const parsePayload = async (request: Request) => {
  try {
    return (await request.json()) as ProgressUpdatePayload;
  } catch {
    return null;
  }
};

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await parsePayload(request);
  const lessonId =
    typeof payload?.lessonId === "string" ? payload.lessonId.trim() : "";

  if (!lessonId || typeof payload?.completed !== "boolean") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  if (payload.completed) {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      create: {
        userId: user.id,
        lessonId,
        completedAt: new Date(),
      },
      update: {
        completedAt: new Date(),
      },
    });
  } else {
    await prisma.lessonProgress.deleteMany({
      where: {
        userId: user.id,
        lessonId,
      },
    });
  }

  return NextResponse.json({ lessonId, completed: payload.completed });
}
