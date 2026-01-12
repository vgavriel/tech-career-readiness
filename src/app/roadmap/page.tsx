import Link from "next/link";

import RoadmapModuleList from "@/components/roadmap-module-list";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      order: true,
      lessons: {
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

  const totalLessons = modules.reduce(
    (count, module) => count + module.lessons.length,
    0
  );
  const firstLessonSlug = modules[0]?.lessons[0]?.slug;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff,_#f7f1e8_55%,_#f0e1cf_100%)]">
      <div className="pointer-events-none absolute -top-24 left-[-6rem] h-64 w-64 rounded-full bg-[color:var(--wash-200)] opacity-70 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-4rem] h-72 w-72 rounded-full bg-[color:var(--accent-500)] opacity-10 blur-[120px]" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-24 pt-14 md:pt-20">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--ink-500)]">
              Curriculum roadmap
            </p>
            <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl">
              Your path through tech recruiting.
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
              Browse modules in order, pick a lesson, and start building the
              habits that convert into interviews and offers.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
              {modules.length} modules · {totalLessons} lessons
            </p>
            {firstLessonSlug ? (
              <Link
                href={`/lesson/${firstLessonSlug}`}
                className="rounded-full bg-[color:var(--ink-900)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--wash-0)] transition hover:-translate-y-0.5"
              >
                Start with lesson 1
              </Link>
            ) : null}
            <a
              href="/api/auth/signin/google"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-700)]"
            >
              Sign in to save progress
            </a>
          </div>
        </section>

        <RoadmapModuleList modules={modules} />
      </main>
    </div>
  );
}
