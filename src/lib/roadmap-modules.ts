import { cacheLife } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ROADMAP_MODULE_SELECT, type RoadmapModule } from "@/lib/roadmap-types";

/**
 * Return ordered roadmap modules with lesson metadata.
 *
 * Uses a one-hour cache to avoid repeated Prisma reads.
 */
export const getRoadmapModules = async (): Promise<RoadmapModule[]> => {
  "use cache";
  cacheLife({ revalidate: 60 * 60 });
  return prisma.module.findMany({
    orderBy: { order: "asc" },
    select: ROADMAP_MODULE_SELECT,
  });
};
