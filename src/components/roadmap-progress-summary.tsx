"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import SignInCta from "@/components/sign-in-cta";

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
  const { completedLessonKeys, isAuthenticated, isMerging, isReady } = useProgress();

  const orderedLessons = useMemo(() => buildOrderedLessons(modules), [modules]);
  const completedSet = useMemo(
    () => new Set(completedLessonKeys),
    [completedLessonKeys]
  );
  const totalLessons = orderedLessons.length;
  const completedCount = useMemo(
    () =>
      orderedLessons.reduce(
        (count, lesson) =>
          count +
          (completedSet.has(lesson.key) || completedSet.has(lesson.id) ? 1 : 0),
        0
      ),
    [completedSet, orderedLessons]
  );

  const continueLesson = useMemo(
    () =>
      orderedLessons.find(
        (lesson) =>
          !completedSet.has(lesson.key) && !completedSet.has(lesson.id)
      ),
    [completedSet, orderedLessons]
  );

  const firstLesson = orderedLessons[0];
  const allComplete = isReady && totalLessons > 0 && completedCount >= totalLessons;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);
  const progressDegrees = Math.min(100, Math.max(0, progressPercent)) * 3.6;

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
    <div className="flex flex-col gap-6 rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-7 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="relative h-24 w-24 rounded-full p-1.5"
          style={{
            background: `conic-gradient(var(--accent-500) ${progressDegrees}deg, var(--wash-200) 0deg)`,
          }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-[color:var(--wash-0)] text-sm font-semibold text-[color:var(--ink-900)]">
            {progressPercent}%
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
            Progress
          </p>
          <p className="text-sm font-semibold text-[color:var(--ink-900)]">
            {progressLabel}
          </p>
          <p className="text-xs text-[color:var(--ink-500)]">
            {modules.length} modules - {totalLessons} lessons
          </p>
        </div>
      </div>

      {primaryLesson ? (
        <Link
          href={`/lesson/${primaryLesson.slug}`}
          className="rounded-full bg-[color:var(--accent-700)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)]"
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
