import type { FocusKey } from "@/lib/focus-options";
import { isExtraCreditLesson } from "@/lib/lesson-classification";

/**
 * Flattened lesson data used for progress calculations.
 */
export type ProgressSummaryLesson = {
  id: string;
  slug: string;
  title: string;
  order: number;
  moduleOrder: number;
};

/**
 * Module data with nested lessons for progress calculations.
 */
export type ProgressSummaryModule = {
  id: string;
  key: string;
  order: number;
  lessons: Array<{
    id: string;
    slug: string;
    title: string;
    order: number;
  }>;
};

/**
 * Progress summary metrics returned to the UI.
 */
export type ProgressSummary = {
  orderedLessons: ProgressSummaryLesson[];
  totalLessons: number;
  completedCount: number;
  progressPercent: number;
  continueLesson?: ProgressSummaryLesson;
  firstLesson?: ProgressSummaryLesson;
  allComplete: boolean;
  progressLabel: string;
};

/**
 * Core CTA details derived from progress summaries.
 */
export type ProgressSummaryCta = {
  primaryLesson: ProgressSummaryLesson | null;
  restartLesson: ProgressSummaryLesson | null;
  ctaLesson: ProgressSummaryLesson | null;
  ctaLabel: string;
  coreComplete: boolean;
  celebratoryMessage: string;
};

/**
 * Input used to compute core, extra, and focus summaries.
 */
export type ProgressSummaryInput = {
  modules: ProgressSummaryModule[];
  completedLessonSlugs: string[];
  isReady: boolean;
  focusKey?: FocusKey | null;
  focusModules?: ProgressSummaryModule[] | null;
};

/**
 * Build ordered lessons from module data for progress calculations.
 */
export const buildOrderedLessons = (modules: ProgressSummaryModule[]): ProgressSummaryLesson[] =>
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
 * Split lessons into core vs extra credit buckets.
 */
export const splitLessonsByCredit = (lessons: ProgressSummaryLesson[]) => {
  const coreLessons: ProgressSummaryLesson[] = [];
  const extraLessons: ProgressSummaryLesson[] = [];

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
 * Build a progress summary for a given lesson list and completion set.
 */
export const buildProgressSummaryFromLessons = (
  orderedLessons: ProgressSummaryLesson[],
  completedSet: Set<string>,
  isReady: boolean
): ProgressSummary => {
  const totalLessons = orderedLessons.length;
  const completedCount = orderedLessons.reduce(
    (count, lesson) => count + (completedSet.has(lesson.slug) ? 1 : 0),
    0
  );
  const continueLesson = orderedLessons.find((lesson) => !completedSet.has(lesson.slug));
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

/**
 * Build core, extra, and focus summaries from module data.
 */
export const buildProgressSummaries = ({
  modules,
  completedLessonSlugs,
  isReady,
  focusKey,
  focusModules,
}: ProgressSummaryInput) => {
  const completedSet = new Set(completedLessonSlugs);
  const orderedLessons = buildOrderedLessons(modules);
  const { coreLessons, extraLessons } = splitLessonsByCredit(orderedLessons);
  const coreSummary = buildProgressSummaryFromLessons(coreLessons, completedSet, isReady);
  const extraSummary = buildProgressSummaryFromLessons(extraLessons, completedSet, isReady);
  let focusSummary: ProgressSummary | null = null;

  if (focusKey && focusModules && focusModules.length > 0) {
    const focusLessons = buildOrderedLessons(focusModules);
    const { coreLessons: focusCoreLessons } = splitLessonsByCredit(focusLessons);
    const summary = buildProgressSummaryFromLessons(focusCoreLessons, completedSet, isReady);
    focusSummary = summary.totalLessons === 0 ? null : summary;
  }

  const activeSummary = focusSummary ?? coreSummary;

  return {
    orderedLessons,
    coreSummary,
    extraSummary,
    focusSummary,
    activeSummary,
  };
};

/**
 * Resolve primary CTA lesson and label from core + active summaries.
 */
export const buildProgressSummaryCta = ({
  coreSummary,
  activeSummary,
}: {
  coreSummary: ProgressSummary;
  activeSummary: ProgressSummary;
}): ProgressSummaryCta => {
  const primaryLesson = activeSummary.continueLesson ?? activeSummary.firstLesson ?? null;
  const coreComplete = coreSummary.allComplete;
  const celebratoryMessage = "Congratulations! You reached the end of the core course.";
  const restartLesson = coreSummary.firstLesson ?? activeSummary.firstLesson ?? null;

  let ctaLesson = primaryLesson;
  let ctaLabel = "Check back soon";

  if (coreComplete) {
    ctaLesson = restartLesson;
    ctaLabel = celebratoryMessage;
  } else if (primaryLesson) {
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

  return {
    primaryLesson,
    restartLesson,
    ctaLesson,
    ctaLabel,
    coreComplete,
    celebratoryMessage,
  };
};
