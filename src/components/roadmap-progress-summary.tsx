"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import SignInCta from "@/components/sign-in-cta";
import { FOCUS_OPTIONS, type FocusKey } from "@/lib/focus-options";

/**
 * Flattened lesson metadata used for progress ordering.
 */
type OrderedLesson = {
  id: string;
  key: string;
  slug: string;
  title: string;
  order: number;
  moduleOrder: number;
};

/**
 * Props for the roadmap progress summary card.
 */
type RoadmapProgressSummaryProps = {
  modules: RoadmapModule[];
  focusModules?: RoadmapModule[] | null;
  focusKey?: FocusKey | null;
};

type ProgressSummary = {
  orderedLessons: OrderedLesson[];
  totalLessons: number;
  completedCount: number;
  progressPercent: number;
  progressDegrees: number;
  continueLesson?: OrderedLesson;
  firstLesson?: OrderedLesson;
  allComplete: boolean;
  progressLabel: string;
};

/**
 * Build ordered lessons from module data for progress calculations.
 */
const buildOrderedLessons = (modules: RoadmapModule[]): OrderedLesson[] =>
  modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      id: lesson.id,
      key: lesson.key,
      slug: lesson.slug,
      title: lesson.title,
      order: lesson.order,
      moduleOrder: module.order,
    }))
  );

const buildProgressSummary = (
  modules: RoadmapModule[],
  completedSet: Set<string>,
  isReady: boolean
): ProgressSummary => {
  const orderedLessons = buildOrderedLessons(modules);
  const totalLessons = orderedLessons.length;
  const completedCount = orderedLessons.reduce(
    (count, lesson) =>
      count +
      (completedSet.has(lesson.key) || completedSet.has(lesson.id) ? 1 : 0),
    0
  );
  const continueLesson = orderedLessons.find(
    (lesson) => !completedSet.has(lesson.key) && !completedSet.has(lesson.id)
  );
  const firstLesson = orderedLessons[0];
  const allComplete = isReady && totalLessons > 0 && completedCount >= totalLessons;
  const progressPercent =
    totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
  const progressDegrees = Math.min(100, Math.max(0, progressPercent)) * 3.6;
  const progressLabel = isReady
    ? `${completedCount} of ${totalLessons} complete`
    : "Loading progress...";

  return {
    orderedLessons,
    totalLessons,
    completedCount,
    progressPercent,
    progressDegrees,
    continueLesson,
    firstLesson,
    allComplete,
    progressLabel,
  };
};

/**
 * Render progress summary, CTA, and sign-in prompt for the roadmap page.
 *
 * @remarks
 * Translates progress context + module ordering into a single progress card;
 * no side effects beyond memoized calculations.
 */
export default function RoadmapProgressSummary({
  modules,
  focusModules,
  focusKey,
}: RoadmapProgressSummaryProps) {
  const { completedLessonKeys, isAuthenticated, isMerging, isReady } = useProgress();
  const completedSet = useMemo(
    () => new Set(completedLessonKeys),
    [completedLessonKeys]
  );
  const overallSummary = useMemo(
    () => buildProgressSummary(modules, completedSet, isReady),
    [modules, completedSet, isReady]
  );
  const focusSummary = useMemo(() => {
    if (!focusKey || !focusModules || focusModules.length === 0) {
      return null;
    }

    const summary = buildProgressSummary(focusModules, completedSet, isReady);
    if (summary.totalLessons === 0) {
      return null;
    }

    return summary;
  }, [completedSet, focusKey, focusModules, isReady]);
  const focusOption = focusKey
    ? FOCUS_OPTIONS.find((option) => option.key === focusKey) ?? null
    : null;
  const activeSummary = focusSummary ?? overallSummary;

  const primaryLesson =
    activeSummary.continueLesson ?? activeSummary.firstLesson;

  let ctaLabel = "Check back soon";
  if (primaryLesson) {
    if (activeSummary.allComplete) {
      ctaLabel = "Review from the start";
    } else if (activeSummary.continueLesson) {
      ctaLabel = "Continue where you left off";
    } else {
      ctaLabel = "Start with lesson 1";
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-7 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="relative h-24 w-24 rounded-full p-1.5"
          style={{
            background: `conic-gradient(var(--accent-500) ${overallSummary.progressDegrees}deg, var(--wash-200) 0deg)`,
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={overallSummary.progressPercent}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[color:var(--wash-0)] text-sm font-semibold text-[color:var(--ink-900)]">
            {overallSummary.progressPercent}%
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
            Progress
          </p>
          <p className="text-sm font-semibold text-[color:var(--ink-900)]">
            {overallSummary.progressLabel}
          </p>
          <p className="text-xs text-[color:var(--ink-500)]">
            {modules.length} modules - {overallSummary.totalLessons} lessons
          </p>
        </div>
      </div>

      {focusSummary && focusOption ? (
        <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
            Focus: {focusOption.label}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-[color:var(--ink-900)]">
            <span>{focusSummary.progressLabel}</span>
            <span>{focusSummary.progressPercent}%</span>
          </div>
        </div>
      ) : null}

      {primaryLesson ? (
        <Link
          href={`/lesson/${primaryLesson.slug}`}
          className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--accent-700)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)] sm:w-auto"
        >
          {ctaLabel}
        </Link>
      ) : null}

      {primaryLesson && activeSummary.continueLesson ? (
        <p className="text-xs text-[color:var(--ink-500)]">
          Up next: Lesson {activeSummary.continueLesson.moduleOrder}.
          {activeSummary.continueLesson.order} - {activeSummary.continueLesson.title}
        </p>
      ) : null}

      {isMerging ? (
        <p className="text-xs text-[color:var(--ink-500)]">
          Syncing guest progress...
        </p>
      ) : null}

      <p className="text-xs text-[color:var(--ink-500)]">
        All lessons are open. Sign in only to save progress.
      </p>

      {!isAuthenticated ? (
        <SignInCta
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-700)]"
        >
          Sign in to save progress
        </SignInCta>
      ) : null}
    </div>
  );
}
