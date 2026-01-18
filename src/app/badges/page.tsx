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
          key: true,
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
      <main className="page-content mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-24 pt-16 md:pt-22">
        <section className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--accent-500)] bg-[color:var(--wash-0)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-800)]">
            <span className="h-2 w-2 rounded-full bg-[color:var(--accent-700)]" />
            Badge awards
          </div>
          <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl">
            Track your recruiting momentum.
          </h1>
          <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
            Badges are earned by finishing core lessons and optional extra
            credit. Keep moving and collect the milestones.
          </p>
        </section>

        <RoadmapBadgeAwards modules={modules} />
      </main>
    </div>
  );
}
