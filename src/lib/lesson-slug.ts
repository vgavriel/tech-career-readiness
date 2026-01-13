import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Lesson selection used by the lesson route for rendering.
 */
const lessonSelect = {
  id: true,
  title: true,
  slug: true,
  order: true,
  moduleId: true,
  publishedUrl: true,
  estimatedMinutes: true,
  objectivesMarkdown: true,
  module: {
    select: {
      title: true,
      order: true,
    },
  },
} satisfies Prisma.LessonSelect;

type LessonPageLesson = Prisma.LessonGetPayload<{ select: typeof lessonSelect }>;

type LessonSlugLookupResult = {
  lesson: LessonPageLesson | null;
  isAlias: boolean;
};

/**
 * Find a lesson by canonical slug, falling back to slug aliases when needed.
 */
export const findLessonBySlug = async (
  slug: string
): Promise<LessonSlugLookupResult> => {
  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    select: lessonSelect,
  });

  if (lesson) {
    return { lesson, isAlias: false };
  }

  const alias = await prisma.lessonSlugAlias.findUnique({
    where: { slug },
    select: { lesson: { select: lessonSelect } },
  });

  if (!alias?.lesson) {
    return { lesson: null, isAlias: false };
  }

  return { lesson: alias.lesson, isAlias: true };
};
