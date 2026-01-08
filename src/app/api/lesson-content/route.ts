import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";

import {
  LESSON_CONTENT_CACHE_TTL_MS,
  getLessonContentCache,
  setLessonContentCache,
} from "@/lib/lesson-content-cache";
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

  if (!shouldBypassCache(searchParams)) {
    const cachedHtml = getLessonContentCache(lesson.id);
    if (cachedHtml) {
      return NextResponse.json({
        lessonId: lesson.id,
        html: cachedHtml,
        cached: true,
      });
    }
  }

  let response: Response;
  try {
    response = await fetch(lesson.publishedUrl, { cache: "no-store" });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch lesson content." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch lesson content." },
      { status: 502 }
    );
  }

  const rawHtml = await response.text();
  const sanitizedHtml = sanitizeHtml(rawHtml);
  setLessonContentCache(lesson.id, sanitizedHtml, LESSON_CONTENT_CACHE_TTL_MS);

  return NextResponse.json({
    lessonId: lesson.id,
    html: sanitizedHtml,
    cached: false,
  });
}
