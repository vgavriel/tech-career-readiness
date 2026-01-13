"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";

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

/**
 * Render progress summary, CTA, and sign-in prompt for the roadmap page.
 *
 * @remarks
 * Translates progress context + module ordering into a single progress card;
 * no side effects beyond memoized calculations.
 */
export default function RoadmapProgressSummary({
  modules,
}: RoadmapProgressSummaryProps) {
  const { completedLessonIds, isAuthenticated, isMerging, isReady } = useProgress();

  const orderedLessons = useMemo(() => buildOrderedLessons(modules), [modules]);
  const completedSet = useMemo(
    () => new Set(completedLessonIds),
    [completedLessonIds]
  );
  const totalLessons = orderedLessons.length;
  const completedCount = useMemo(
    () =>
      orderedLessons.reduce(
        (count, lesson) => count + (completedSet.has(lesson.id) ? 1 : 0),
        0
      ),
    [completedSet, orderedLessons]
  );

  const continueLesson = useMemo(
    () => orderedLessons.find((lesson) => !completedSet.has(lesson.id)),
    [completedSet, orderedLessons]
  );

  const firstLesson = orderedLessons[0];
  const allComplete = isReady && totalLessons > 0 && completedCount >= totalLessons;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  const primaryLesson = continueLesson ?? firstLesson;
  const progressLabel = isReady
    ? `${completedCount} of ${totalLessons} complete`
    : "Loading progress...";

  let ctaLabel = "Check back soon";
  if (primaryLesson) {
    if (allComplete) {
      ctaLabel = "Review from the start";
    } else if (continueLesson) {
      ctaLabel = "Continue where you left off";
    } else {
      ctaLabel = "Start with lesson 1";
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-soft)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
        {modules.length} modules - {totalLessons} lessons
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-[color:var(--wash-200)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div
            className="h-2 rounded-full bg-[color:var(--accent-500)] transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-[color:var(--ink-500)]">{progressLabel}</p>
      </div>

      {primaryLesson ? (
        <Link
          href={`/lesson/${primaryLesson.slug}`}
          className="rounded-full bg-[color:var(--ink-900)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--wash-0)] transition hover:-translate-y-0.5"
        >
          {ctaLabel}
        </Link>
      ) : null}

      {primaryLesson && continueLesson ? (
        <p className="text-xs text-[color:var(--ink-500)]">
          Up next: Lesson {continueLesson.moduleOrder}.{continueLesson.order} -{" "}
          {continueLesson.title}
        </p>
      ) : null}

      {isMerging ? (
        <p className="text-xs text-[color:var(--ink-500)]">Syncing guest progress...</p>
      ) : null}

      {!isAuthenticated ? (
        <Link
          href="/api/auth/signin/google"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-700)]"
        >
          Sign in to save progress
        </Link>
      ) : null}
    </div>
  );
}
