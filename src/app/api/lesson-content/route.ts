import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchLessonContent } from "@/lib/lesson-content";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Interpret truthy query flags from string values.
 */
const isTruthy = (value: string | null) => value === "1" || value === "true";

/**
 * Determine whether to bypass cache in development requests.
 */
const shouldBypassCache = (searchParams: URLSearchParams) => {
  const env = getEnv();
  if (!env.isLocal) {
    return false;
  }

  return isTruthy(searchParams.get("bypassCache"));
};

const lessonQuerySchema = z
  .object({
    lessonId: z.string().trim().min(1).optional(),
    slug: z.string().trim().min(1).optional(),
  })
  .refine((data) => Boolean(data.lessonId || data.slug), {
    message: "Provide lessonId or slug.",
  });

/**
 * GET /api/lesson-content: fetch sanitized lesson HTML by lesson id or slug.
 */
export async function GET(request: Request) {
  const rateLimitResponse = await enforceRateLimit(
    request,
    "lesson-content",
    null
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = lessonQuerySchema.safeParse({
    lessonId: searchParams.get("lessonId") ?? undefined,
    slug: searchParams.get("slug") ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Provide lessonId or slug." },
      { status: 400 }
    );
  }

  const { lessonId, slug } = parsedQuery.data;

  let lesson = await prisma.lesson.findFirst({
    where: lessonId
      ? { id: lessonId, isArchived: false }
      : { slug: slug ?? "", isArchived: false },
    select: {
      id: true,
      publishedUrl: true,
    },
  });

  if (!lesson && slug) {
    const alias = await prisma.lessonSlugAlias.findUnique({
      where: { slug },
      select: {
        lesson: {
          select: {
            id: true,
            publishedUrl: true,
            isArchived: true,
          },
        },
      },
    });
    if (alias?.lesson && !alias.lesson.isArchived) {
      lesson = {
        id: alias.lesson.id,
        publishedUrl: alias.lesson.publishedUrl,
      };
    }
  }

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
