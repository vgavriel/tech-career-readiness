import Link from "next/link";
import { getServerSession } from "next-auth";

import FocusPicker from "@/components/focus-picker";
import HomeProgressCard from "@/components/home-progress-card";
import { authOptions } from "@/lib/auth";
import { getLessonExample } from "@/lib/lesson-examples";
import { prisma } from "@/lib/prisma";

/**
 * Renders the marketing landing page with the primary CTAs and highlights.
 *
 * @remarks
 * Provides a concise entry point for new visitors; no state or side effects.
 */
export default async function Home() {
  const session = await getServerSession(authOptions);
  const lessonExample = getLessonExample("start-to-finish-roadmap");
  const startLessonSlug = lessonExample?.slug ?? "start-to-finish-roadmap";
  const startLessonHref = `/lesson/${startLessonSlug}`;
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
  const outcomes = lessonExample?.outcomes ?? [
    "Pick the focus that matches your urgency.",
    "Sequence the next three lessons.",
    "Turn the plan into weekly action.",
  ];
  const stats = [
    { label: "9 modules", value: "Brown-specific sequence" },
    { label: "Short lessons", value: "15-30 minutes" },
  ];

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <main
        id="main-content"
        tabIndex={-1}
        className="page-content mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-20 pt-12 md:pt-20 lg:gap-14"
      >
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6 animate-rise">
            <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-2 text-xs font-semibold text-[color:var(--ink-700)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--accent-700)]" />
              Brown CS recruiting roadmap
            </div>
            <h1 className="font-display text-4xl leading-[1.1] text-[color:var(--ink-900)] md:text-5xl lg:text-6xl">
              Calm, step-by-step prep for tech recruiting at Brown.
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
              Short, focused lessons paired with Brown-specific resources so you
              always know the next move.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={startLessonHref}
                className="no-underline inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] px-5 py-2 text-xs font-semibold text-[color:var(--ink-900)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--ink-900)]"
              >
                Start with lesson 1
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-[color:var(--ink-500)]">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-3 py-1.5"
                >
                  <span className="text-[color:var(--ink-700)]">
                    {item.label}
                  </span>{" "}
                  <span className="text-[color:var(--ink-500)]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-rise-delayed">
            <HomeProgressCard modules={modules} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-700)]">
                Module 1
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl text-[color:var(--ink-900)]">
              {lessonExample?.title ?? "Start to Finish Roadmap"}
            </h2>
            <p className="mt-2 text-sm text-[color:var(--ink-700)]">
              {lessonExample?.summary ??
                "See the recruiting sequence end-to-end and pick a focus."}
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-[color:var(--ink-700)]">
              {outcomes.slice(0, 2).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[color:var(--accent-700)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--ink-500)]">
              <span>{lessonExample?.estimatedMinutes ?? 25} min read</span>
              <Link
                href={startLessonHref}
                className="text-xs font-semibold text-[color:var(--accent-700)]"
              >
                Open lesson
              </Link>
            </div>
          </div>

          <FocusPicker className="animate-rise" startHref={startLessonHref} />
        </section>
      </main>
    </div>
  );
}
