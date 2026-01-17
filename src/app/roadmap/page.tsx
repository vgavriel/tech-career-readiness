import RoadmapFocusModuleList from "@/components/roadmap-focus-module-list";
import { RoadmapFocusProvider } from "@/components/roadmap-focus-provider";
import RoadmapFocusSummary from "@/components/roadmap-focus-summary";
import { FOCUS_QUERY_PARAM } from "@/lib/focus-options";
import { getFocusKeyFromParam } from "@/lib/focus-order";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RoadmapPageProps = {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Render the curriculum roadmap with modules, lessons, and progress summary.
 *
 * @remarks
 * Loads ordered modules server-side and passes them to the client-side progress
 * UI; no local state.
 */
export default async function RoadmapPage({ searchParams }: RoadmapPageProps) {
  const resolvedSearchParams = await searchParams;
  const focusKey = getFocusKeyFromParam(
    resolvedSearchParams?.[FOCUS_QUERY_PARAM]
  );
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
      <main className="page-content mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-16 md:pt-22">
        <RoadmapFocusProvider modules={modules} focusKey={focusKey}>
          <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--accent-500)] bg-[color:var(--wash-0)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-800)]">
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
            </div>
            <RoadmapFocusSummary modules={modules} />
          </section>

          <RoadmapFocusModuleList modules={modules} />
        </RoadmapFocusProvider>
      </main>
    </div>
  );
}
