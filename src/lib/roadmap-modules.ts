import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { ROADMAP_MODULE_SELECT, type RoadmapModule } from "@/lib/roadmap-types";

/**
 * Return ordered roadmap modules with lesson metadata.
 *
 * Share public metadata for one hour even though HTML renders per request.
 */
export const getRoadmapModules = unstable_cache(
  async (): Promise<RoadmapModule[]> =>
    prisma.module.findMany({
      orderBy: { order: "asc" },
      select: ROADMAP_MODULE_SELECT,
    }),
  ["roadmap-modules"],
  { revalidate: 60 * 60 }
);
