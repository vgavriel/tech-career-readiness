import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Redirect legacy roadmap visits to the first lesson.
 */
export default async function RoadmapPage() {
  const firstModule = await prisma.module.findFirst({
    orderBy: { order: "asc" },
    select: {
      lessons: {
        where: { isArchived: false },
        orderBy: { order: "asc" },
        select: {
          slug: true,
        },
      },
    },
  });

  const firstLesson = firstModule?.lessons[0]?.slug ?? null;
  if (!firstLesson) {
    redirect("/");
  }

  redirect(`/lesson/${firstLesson}`);
}
