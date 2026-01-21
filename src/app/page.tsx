import FocusPicker from "@/components/focus-picker";
import HomeProgressCard from "@/components/home-progress-card";
import { prisma } from "@/lib/prisma";

/**
 * Renders the marketing landing page with the primary CTAs and highlights.
 *
 * @remarks
 * Provides a concise entry point for new visitors; no state or side effects.
 */
export default async function Home() {
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
        className="page-content mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-20 pt-12 md:pt-20 lg:gap-14"
      >
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6 animate-rise">
            <h1 className="font-display text-4xl leading-[1.1] text-[color:var(--ink-900)] md:text-5xl lg:text-6xl">
              Calm, step-by-step prep for tech recruiting at Brown.
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
              Short, focused lessons paired with Brown-specific resources so you
              always know the next move.
            </p>
            <p className="text-xs font-semibold text-[color:var(--ink-500)]">
              9 modules · 15-30 minutes each
            </p>
          </div>

          <div className="animate-rise-delayed">
            <HomeProgressCard modules={modules} />
          </div>
        </section>

        <section className="animate-rise">
          <FocusPicker />
        </section>
      </main>
    </div>
  );
}
