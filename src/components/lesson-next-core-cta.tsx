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
      <div className="hidden md:block">
        <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-5 py-4 shadow-[var(--shadow-card)] md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <p className="min-w-0 truncate text-md font-semibold text-[color:var(--ink-700)]">
              Up Next: {metaLabel} - {nextLesson.title}
            </p>
            <Link
              href={nextHref}
              className="no-underline inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-700)] px-4 py-2 text-sm font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)]"
            >
              Next core lesson
            </Link>
          </div>
        </div>
        <div aria-hidden="true" className="h-6" />
      </div>

      <div className="md:hidden sticky bottom-0 z-10">
        <div className="w-full">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] px-4 py-3 shadow-[var(--shadow-card)]">
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
