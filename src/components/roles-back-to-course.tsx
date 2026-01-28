"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useFocus } from "@/components/focus-provider";
import { useProgress } from "@/components/progress-provider";
import { orderModulesForFocus } from "@/lib/focus-order";
import { buildProgressSummaries, type ProgressSummaryModule } from "@/lib/progress-summary";

/**
 * Props for the back-to-course button on the Roles page.
 */
type RolesBackToCourseProps = {
  modules: ProgressSummaryModule[];
};

/**
 * Render a CTA that links back to the user's next lesson.
 */
export default function RolesBackToCourse({ modules }: RolesBackToCourseProps) {
  const { focusKey } = useFocus();
  const { completedLessonSlugs, isReady } = useProgress();
  const focusModules = useMemo(
    () => (focusKey ? orderModulesForFocus(modules, focusKey) : null),
    [focusKey, modules]
  );

  const { activeSummary } = useMemo(
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

  const primaryLesson = activeSummary.continueLesson ?? activeSummary.firstLesson;

  if (!primaryLesson) {
    return null;
  }

  return (
    <Link
      href={`/lesson/${primaryLesson.slug}`}
      className="no-underline inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink-900)] transition hover:border-[color:var(--ink-800)] sm:w-auto"
    >
      Back to course
    </Link>
  );
}
