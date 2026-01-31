import Link from "next/link";

import LessonNotFoundCta from "@/components/lesson-not-found-cta";
import { getRoadmapModules } from "@/lib/roadmap-modules";

/**
 * Render a helpful not-found state for missing lessons.
 */
export default async function LessonNotFound() {
  const modules = await getRoadmapModules();

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <main
        id="main-content"
        tabIndex={-1}
        className="page-content mx-auto flex w-full max-w-4xl flex-col px-5 pb-20 pt-12 md:pt-20"
      >
        <section className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
            Lesson not found
          </p>
          <h1 className="font-display mt-4 text-3xl text-[color:var(--ink-900)] md:text-4xl">
            We could not find that lesson.
          </h1>
          <p className="mt-3 text-sm text-[color:var(--ink-700)] md:text-base">
            The lesson may have moved or been renamed. Jump back into the curriculum to pick the
            next lesson in sequence.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <LessonNotFoundCta modules={modules} />
            <Link
              href="/"
              className="no-underline inline-flex min-h-11 items-center justify-center rounded-lg border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:-translate-y-0.5 hover:border-[color:var(--ink-800)] hover:bg-[color:var(--accent-500)]"
            >
              Go to landing
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
