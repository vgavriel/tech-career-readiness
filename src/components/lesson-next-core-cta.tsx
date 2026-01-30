"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useFocus } from "@/components/focus-provider";
import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import { orderModulesForFocus } from "@/lib/focus-order";
import {
  buildOrderedLessons,
  buildProgressSummaryFromLessons,
  type ProgressSummaryLesson,
  splitLessonsByCredit,
} from "@/lib/progress-summary";

/**
 * Props for the next core lesson CTA.
 */
type LessonNextCoreCtaProps = {
  modules: RoadmapModule[];
  currentLessonSlug: string;
};

/**
 * Render a focus-aware CTA that jumps to the next core lesson.
 */
export default function LessonNextCoreCta({ modules, currentLessonSlug }: LessonNextCoreCtaProps) {
  const { focusKey } = useFocus();
  const { completedLessonSlugs, isReady } = useProgress();

  const nextLesson = useMemo(() => {
    const orderedModules = orderModulesForFocus(modules, focusKey);
    const orderedLessons = buildOrderedLessons(orderedModules);
    const { coreLessons } = splitLessonsByCredit(orderedLessons);
    const currentIndex = coreLessons.findIndex((lesson) => lesson.slug === currentLessonSlug);

    if (currentIndex >= 0) {
      return coreLessons[currentIndex + 1] ?? null;
    }

    if (coreLessons.length === 0) {
      return null;
    }

    const completedSet = new Set(completedLessonSlugs);
    const summary = buildProgressSummaryFromLessons(coreLessons, completedSet, isReady);
    const candidate = summary.continueLesson ?? summary.firstLesson ?? null;

    if (!candidate || candidate.slug === currentLessonSlug) {
      return null;
    }

    return candidate;
  }, [completedLessonSlugs, currentLessonSlug, focusKey, isReady, modules]);

  if (!nextLesson) {
    return null;
  }

  const metaLabel = `Module ${nextLesson.moduleOrder} - Lesson ${nextLesson.order}`;
  const nextHref = `/lesson/${nextLesson.slug}`;

  return (
    <>
      <div className="hidden md:block rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
            Up next (core)
          </p>
          <h2 className="font-display text-2xl text-[color:var(--ink-900)] md:text-3xl">
            {nextLesson.title}
          </h2>
          <p className="text-sm font-semibold text-[color:var(--ink-600)]">{metaLabel}</p>
        </div>
        <Link
          href={nextHref}
          className="no-underline mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--accent-700)] px-5 py-2.5 text-sm font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)]"
        >
          Next core lesson
        </Link>
      </div>

      <div className="md:hidden fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10">
        <div className="mx-auto w-[min(100%-2rem,540px)]">
          <div className="flex items-center justify-between gap-3 rounded-full border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] px-4 py-3 shadow-[var(--shadow-card)]">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
                Up next
              </p>
              <p className="truncate text-sm font-semibold text-[color:var(--ink-900)]">
                {nextLesson.title}
              </p>
            </div>
            <Link
              href={nextHref}
              className="no-underline inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-700)] px-4 py-2 text-sm font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)]"
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
