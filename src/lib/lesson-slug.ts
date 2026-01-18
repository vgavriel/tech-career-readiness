import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Lesson selection used by the lesson route for rendering.
 */
const lessonSelect = {
  id: true,
  key: true,
  title: true,
  slug: true,
  order: true,
  moduleId: true,
  publishedUrl: true,
  estimatedMinutes: true,
  objectivesMarkdown: true,
  isArchived: true,
  supersededBy: {
    select: {
      id: true,
      slug: true,
      title: true,
      order: true,
      isArchived: true,
      module: {
        select: {
          title: true,
          order: true,
        },
      },
    },
  },
  module: {
    select: {
      key: true,
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

type LessonSearchParams = Record<string, string | string[] | undefined>;

/**
 * Build a query string from search params while preserving repeated keys.
 */
const buildQueryString = (searchParams?: LessonSearchParams) => {
  if (!searchParams) {
    return "";
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        query.append(key, entry);
      });
    } else {
      query.append(key, value);
    }
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Build the canonical lesson redirect path with preserved query params.
 */
export const buildLessonRedirectPath = (
  slug: string,
  searchParams?: LessonSearchParams
) => `/lesson/${slug}${buildQueryString(searchParams)}`;

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
