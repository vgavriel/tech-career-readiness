import type { Prisma } from "@prisma/client";

/**
 * Canonical module projection used by roadmap and progress surfaces.
 */
export const ROADMAP_MODULE_SELECT = {
  id: true,
  key: true,
  title: true,
  description: true,
  order: true,
  lessons: {
    where: { isArchived: false },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      order: true,
      estimatedMinutes: true,
    },
  },
} as const satisfies Prisma.ModuleSelect;

/**
 * Module metadata used across roadmap and progress features.
 */
export type RoadmapModule = Prisma.ModuleGetPayload<{
  select: typeof ROADMAP_MODULE_SELECT;
}>;

/**
 * Lesson metadata used across roadmap and progress features.
 */
export type RoadmapLesson = RoadmapModule["lessons"][number];
