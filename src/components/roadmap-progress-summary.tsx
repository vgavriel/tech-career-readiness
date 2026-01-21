"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import SignInCta from "@/components/sign-in-cta";
import { FOCUS_OPTIONS, type FocusKey } from "@/lib/focus-options";
import { isExtraCreditLesson } from "@/lib/lesson-classification";

/**
 * Flattened lesson metadata used for progress ordering.
 */
type OrderedLesson = {
  id: string;
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
  showExtraCredit?: boolean;
  showNextLesson?: boolean;
  showSignIn?: boolean;
};

type ProgressSummary = {
  orderedLessons: OrderedLesson[];
  totalLessons: number;
  completedCount: number;
  progressPercent: number;
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
      slug: lesson.slug,
      title: lesson.title,
      order: lesson.order,
      moduleOrder: module.order,
    }))
  );

const buildProgressSummaryFromLessons = (
  orderedLessons: OrderedLesson[],
  completedSet: Set<string>,
  isReady: boolean
): ProgressSummary => {
  const totalLessons = orderedLessons.length;
  const completedCount = orderedLessons.reduce(
    (count, lesson) =>
      count + (completedSet.has(lesson.slug) ? 1 : 0),
    0
  );
  const continueLesson = orderedLessons.find(
    (lesson) => !completedSet.has(lesson.slug)
  );
  const firstLesson = orderedLessons[0];
  const allComplete = isReady && totalLessons > 0 && completedCount >= totalLessons;
  const progressPercent =
    totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
  const progressLabel = isReady
    ? `${completedCount} of ${totalLessons} complete`
    : "Loading progress...";

  return {
    orderedLessons,
    totalLessons,
    completedCount,
    progressPercent,
    continueLesson,
    firstLesson,
    allComplete,
    progressLabel,
  };
};

const splitLessonsByCredit = (lessons: OrderedLesson[]) => {
  const coreLessons: OrderedLesson[] = [];
  const extraLessons: OrderedLesson[] = [];

  for (const lesson of lessons) {
    if (isExtraCreditLesson(lesson)) {
      extraLessons.push(lesson);
    } else {
      coreLessons.push(lesson);
    }
  }

  return { coreLessons, extraLessons };
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
  showExtraCredit = true,
  showNextLesson = true,
  showSignIn = true,
}: RoadmapProgressSummaryProps) {
  const { completedLessonSlugs, isAuthenticated, isMerging, isReady } = useProgress();
  const completedSet = useMemo(
    () => new Set(completedLessonSlugs),
    [completedLessonSlugs]
  );
  const orderedLessons = useMemo(() => buildOrderedLessons(modules), [modules]);
  const { coreLessons, extraLessons } = useMemo(
    () => splitLessonsByCredit(orderedLessons),
    [orderedLessons]
  );
  const coreSummary = useMemo(
    () => buildProgressSummaryFromLessons(coreLessons, completedSet, isReady),
    [coreLessons, completedSet, isReady]
  );
  const extraSummary = useMemo(
    () => buildProgressSummaryFromLessons(extraLessons, completedSet, isReady),
    [extraLessons, completedSet, isReady]
  );
  const focusSummary = useMemo(() => {
    if (!focusKey || !focusModules || focusModules.length === 0) {
      return null;
    }

    const focusLessons = buildOrderedLessons(focusModules);
    const { coreLessons: focusCoreLessons } =
      splitLessonsByCredit(focusLessons);
    const summary = buildProgressSummaryFromLessons(
      focusCoreLessons,
      completedSet,
      isReady
    );
    if (summary.totalLessons === 0) {
      return null;
    }

    return summary;
  }, [completedSet, focusKey, focusModules, isReady]);
  const focusOption = focusKey
    ? FOCUS_OPTIONS.find((option) => option.key === focusKey) ?? null
    : null;
  const activeSummary = focusSummary ?? coreSummary;
  const progressValue = Math.min(100, Math.max(0, coreSummary.progressPercent));
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressValue / 100);

  const primaryLesson =
    activeSummary.continueLesson ?? activeSummary.firstLesson;

  const headerLabel = activeSummary.allComplete
    ? "Review your course."
    : activeSummary.completedCount === 0
      ? "Start your course."
      : "Continue your course.";

  let ctaLabel = "Check back soon";
  if (primaryLesson) {
    if (activeSummary.allComplete) {
      ctaLabel = "Review course";
    } else if (activeSummary.completedCount === 0) {
      ctaLabel = "Start course";
    } else if (activeSummary.continueLesson) {
      ctaLabel = "Continue course";
    } else {
      ctaLabel = "Start course";
    }
  }
  const progressTitle = showExtraCredit ? "Core progress" : "Progress";

  return (
    <div className="flex flex-col gap-6 rounded-[28px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-6 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
        {headerLabel}
      </h2>

      <div className="flex flex-wrap items-center gap-4">
        <div
          className="relative h-24 w-24"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressValue}
          aria-valuetext={coreSummary.progressLabel}
        >
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke="var(--wash-200)"
              strokeWidth={8}
            />
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke="var(--accent-700)"
              strokeWidth={8}
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[color:var(--wash-0)] text-sm font-semibold text-[color:var(--ink-900)]">
            {coreSummary.progressPercent}%
          </div>
        </div>
          <div className="space-y-1">
          <p className="text-xs font-semibold text-[color:var(--ink-500)]">
            {progressTitle}
          </p>
          <p className="text-sm font-semibold text-[color:var(--ink-900)]">
            {coreSummary.progressLabel}
          </p>
        </div>
      </div>

      {focusSummary && focusOption ? (
        <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4">
          <p className="text-xs font-semibold text-[color:var(--ink-500)]">
            Focus: {focusOption.label}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-[color:var(--ink-900)]">
            <span>{focusSummary.progressLabel}</span>
            <span>{focusSummary.progressPercent}%</span>
          </div>
        </div>
      ) : null}

      {showExtraCredit && extraSummary.totalLessons > 0 ? (
        <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4">
          <p className="text-xs font-semibold text-[color:var(--ink-500)]">
            Extra credit
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-[color:var(--ink-900)]">
            <span>{extraSummary.progressLabel}</span>
            <span>{extraSummary.progressPercent}%</span>
          </div>
        </div>
      ) : null}

      {primaryLesson ? (
        <Link
          href={`/lesson/${primaryLesson.slug}`}
          className="no-underline inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[color:var(--accent-700)] px-5 py-2.5 text-xs font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)] sm:w-auto"
        >
          {ctaLabel}
        </Link>
      ) : null}

      {showNextLesson && primaryLesson && activeSummary.continueLesson ? (
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

      {!isAuthenticated && showSignIn ? (
        <SignInCta
          className="inline-flex min-h-11 items-center px-3 text-xs font-semibold text-[color:var(--accent-700)]"
        >
          Sign in to save progress
        </SignInCta>
      ) : null}
    </div>
  );
}
