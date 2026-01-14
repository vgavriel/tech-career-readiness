import RoadmapModuleList from "@/components/roadmap-module-list";
import RoadmapProgressSummary from "@/components/roadmap-progress-summary";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Render the curriculum roadmap with modules, lessons, and progress summary.
 *
 * @remarks
 * Loads ordered modules server-side and passes them to the client-side progress
 * UI; no local state.
 */
export default async function RoadmapPage() {
  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
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
      <main className="page-content mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-24 pt-14 md:pt-20">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--accent-500)] bg-[color:var(--wash-0)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--ink-800)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--accent-700)]" />
              Curriculum roadmap
            </div>
            <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl">
              Your path through tech recruiting.
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
              Browse modules in order, pick a lesson, and start building the
              habits that convert into interviews and offers.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-800)]">
              <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-3 py-1 text-[color:var(--ink-900)]">
                Open access
              </span>
              <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-3 py-1 text-[color:var(--ink-700)]">
                Sign in to sync progress
              </span>
            </div>
          </div>
          <RoadmapProgressSummary modules={modules} />
        </section>

        <RoadmapModuleList modules={modules} />
      </main>
    </div>
  );
}
