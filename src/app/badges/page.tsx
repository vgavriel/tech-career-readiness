import RoadmapBadgeAwards from "@/components/roadmap-badge-awards";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Render the badges overview for earned and in-progress awards.
 */
export default async function BadgesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    select: {
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
    },
  });

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <main
        id="main-content"
        tabIndex={-1}
        className="page-content mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 pb-20 pt-12 md:pt-16"
      >
        <section className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-2 text-xs font-semibold text-[color:var(--ink-700)]">
            <span className="h-2 w-2 rounded-full bg-[color:var(--accent-700)]" />
            Badge awards
          </div>
          <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl">
            See your recruiting momentum.
          </h1>
          <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
            Earn badges by completing core lessons and optional extra credit.
            Every milestone is a signal of steady progress.
          </p>
        </section>

        <RoadmapBadgeAwards modules={modules} />
      </main>
    </div>
  );
}
