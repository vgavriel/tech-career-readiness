import { NextResponse } from "next/server";
import { fetchLessonContent } from "@/lib/lesson-content";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const isTruthy = (value: string | null) => value === "1" || value === "true";

const shouldBypassCache = (searchParams: URLSearchParams) => {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  return isTruthy(searchParams.get("bypassCache"));
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId")?.trim();
  const slug = searchParams.get("slug")?.trim();

  if (!lessonId && !slug) {
    return NextResponse.json(
      { error: "Provide lessonId or slug." },
      { status: 400 }
    );
  }

  const lesson = await prisma.lesson.findUnique({
    where: lessonId ? { id: lessonId } : { slug: slug ?? "" },
    select: {
      id: true,
      publishedUrl: true,
    },
  });

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
  }

  try {
    const content = await fetchLessonContent(lesson, {
      bypassCache: shouldBypassCache(searchParams),
    });
    return NextResponse.json(content);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch lesson content." },
      { status: 502 }
    );
  }
}
