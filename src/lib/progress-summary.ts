import { isExtraCreditLesson } from "@/lib/lesson-classification";
import type { FocusKey } from "@/lib/focus-options";

export type ProgressSummaryLesson = {
  id: string;
  slug: string;
  title: string;
  order: number;
  moduleOrder: number;
};

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
export const buildOrderedLessons = (
  modules: ProgressSummaryModule[]
): ProgressSummaryLesson[] =>
  modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      order: lesson.order,
      moduleOrder: module.order,
    }))
  );

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
  const coreSummary = buildProgressSummaryFromLessons(
    coreLessons,
    completedSet,
    isReady
  );
  const extraSummary = buildProgressSummaryFromLessons(
    extraLessons,
    completedSet,
    isReady
  );
  let focusSummary: ProgressSummary | null = null;

  if (focusKey && focusModules && focusModules.length > 0) {
    const focusLessons = buildOrderedLessons(focusModules);
    const { coreLessons: focusCoreLessons } =
      splitLessonsByCredit(focusLessons);
    const summary = buildProgressSummaryFromLessons(
      focusCoreLessons,
      completedSet,
      isReady
    );
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
