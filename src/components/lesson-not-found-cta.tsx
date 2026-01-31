"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useFocus } from "@/components/focus-provider";
import { useProgress } from "@/components/progress-provider";
import { orderModulesForFocus } from "@/lib/focus-order";
import { buildProgressSummaries, type ProgressSummaryModule } from "@/lib/progress-summary";

/**
 * Props for the lesson not-found CTA.
 */
type LessonNotFoundCtaProps = {
  modules: ProgressSummaryModule[];
};

/**
 * Render a back-to-course CTA for the lesson not-found state.
 */
export default function LessonNotFoundCta({ modules }: LessonNotFoundCtaProps) {
  const { focusKey } = useFocus();
  const { completedLessonSlugs, isReady } = useProgress();
  const focusModules = useMemo(
    () => (focusKey ? orderModulesForFocus(modules, focusKey) : null),
    [focusKey, modules]
  );

  const { activeSummary, coreSummary } = useMemo(
    () =>
      buildProgressSummaries({
        modules,
        completedLessonSlugs,
        isReady,
        focusKey,
        focusModules,
      }),
    [completedLessonSlugs, focusKey, focusModules, isReady, modules]
  );

  if (coreSummary.allComplete) {
    return (
      <p className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink-700)]">
        You reached the end of the core course.
      </p>
    );
  }

  const primaryLesson = activeSummary.continueLesson ?? activeSummary.firstLesson;

  if (!primaryLesson) {
    return null;
  }

  return (
    <Link
      href={`/lesson/${primaryLesson.slug}`}
      className="no-underline inline-flex min-h-11 items-center justify-center rounded-lg bg-[color:var(--accent-700)] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)]"
    >
      Back to course
    </Link>
  );
}
