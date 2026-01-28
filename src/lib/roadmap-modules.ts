import { cacheLife } from "next/cache";

import { prisma } from "@/lib/prisma";

const ROADMAP_MODULE_SELECT = {
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
} as const;

/**
 * Return ordered roadmap modules with lesson metadata.
 */
export const getRoadmapModules = async () => {
  "use cache";
  cacheLife({ revalidate: 60 * 60 });
  return prisma.module.findMany({
    orderBy: { order: "asc" },
    select: ROADMAP_MODULE_SELECT,
  });
};
