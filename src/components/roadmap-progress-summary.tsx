"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProgress } from "@/components/progress-provider";
import SignInCta from "@/components/sign-in-cta";
import { FOCUS_OPTIONS, type FocusKey } from "@/lib/focus-options";
import { buildProgressSummaries, type ProgressSummaryModule } from "@/lib/progress-summary";

/**
 * Props for the roadmap progress summary card.
 */
type RoadmapProgressSummaryProps = {
  modules: ProgressSummaryModule[];
  focusModules?: ProgressSummaryModule[] | null;
  focusKey?: FocusKey | null;
  showExtraCredit?: boolean;
  showNextLesson?: boolean;
  showSignIn?: boolean;
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
  const { coreSummary, extraSummary, focusSummary, activeSummary } = useMemo(
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
  const focusOption = focusKey
    ? (FOCUS_OPTIONS.find((option) => option.key === focusKey) ?? null)
    : null;
  const progressValue = Math.min(100, Math.max(0, coreSummary.progressPercent));
  const ringRadius = 44;
  const ringStroke = 10;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressValue / 100);

  const primaryLesson = activeSummary.continueLesson ?? activeSummary.firstLesson;

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
  const progressTitle = showExtraCredit ? "Core progress" : "Course Progress";

  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex flex-wrap items-center gap-5">
        <div
          className="relative h-28 w-28"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressValue}
          aria-valuetext={coreSummary.progressLabel}
        >
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke="var(--ring-track)"
              strokeWidth={ringStroke}
            />
            <circle
              cx="50"
              cy="50"
              r={ringRadius}
              fill="none"
              stroke="var(--accent-700)"
              strokeWidth={ringStroke}
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-3 flex items-center justify-center rounded-full bg-[color:var(--wash-0)] text-lg font-semibold text-[color:var(--ink-900)] shadow-[var(--shadow-soft)]">
            {coreSummary.progressPercent}%
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-[color:var(--ink-600)]">{progressTitle}</p>
          <p className="text-lg font-semibold text-[color:var(--ink-900)]">
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
            <span>Focus progress: {focusSummary.progressLabel}</span>
            <span>{focusSummary.progressPercent}%</span>
          </div>
        </div>
      ) : null}

      {showExtraCredit && extraSummary.totalLessons > 0 ? (
        <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4">
          <p className="text-xs font-semibold text-[color:var(--ink-500)]">Extra credit</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-[color:var(--ink-900)]">
            <span>{extraSummary.progressLabel}</span>
            <span>{extraSummary.progressPercent}%</span>
          </div>
        </div>
      ) : null}

      {primaryLesson ? (
        <Link
          href={`/lesson/${primaryLesson.slug}`}
          className="no-underline inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[color:var(--accent-700)] px-5 py-2.5 text-md font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)] sm:w-auto"
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
        <p className="text-xs text-[color:var(--ink-500)]">Syncing guest progress...</p>
      ) : null}

      {!isAuthenticated && showSignIn ? (
        <SignInCta className="inline-flex min-h-11 items-center px-3 text-xs font-semibold text-[color:var(--accent-700)]">
          Sign in to save progress
        </SignInCta>
      ) : null}
    </div>
  );
}
