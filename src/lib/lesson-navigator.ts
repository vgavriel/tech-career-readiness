import type { FocusKey } from "@/lib/focus-options";
import { isExtraCreditLesson } from "@/lib/lesson-classification";
import type { RoadmapLesson, RoadmapModule } from "@/lib/roadmap-types";

/**
 * Progress details for a single module section in the lesson navigator.
 */
export type ModuleProgressSnapshot = {
  coreLessons: RoadmapLesson[];
  extraLessons: RoadmapLesson[];
  extraCompletedCount: number;
  isModuleComplete: boolean;
  progressLabel: string;
  isActiveExtra: boolean;
};

/**
 * Determine whether the current module remains visible under the active focus filter.
 */
export const isCurrentModuleVisibleForFocus = ({
  focusKey,
  currentModuleKey,
  visibleModules,
}: {
  focusKey: FocusKey | null;
  currentModuleKey: string | null;
  visibleModules: RoadmapModule[];
}) => {
  if (!focusKey || !currentModuleKey) {
    return true;
  }

  return visibleModules.some((module) => module.key === currentModuleKey);
};

/**
 * Compute derived progress state for a single navigator module section.
 */
export const getModuleProgressSnapshot = ({
  module,
  currentLessonSlug,
  isReady,
  isLessonCompleted,
}: {
  module: RoadmapModule;
  currentLessonSlug: string;
  isReady: boolean;
  isLessonCompleted: (lessonSlug: string) => boolean;
}): ModuleProgressSnapshot => {
  const coreLessons = module.lessons.filter((lesson) => !isExtraCreditLesson(lesson));
  const extraLessons = module.lessons.filter((lesson) => isExtraCreditLesson(lesson));
  const coreCompletedCount = coreLessons.reduce(
    (count, lesson) => count + (isReady && isLessonCompleted(lesson.slug) ? 1 : 0),
    0
  );
  const extraCompletedCount = extraLessons.reduce(
    (count, lesson) => count + (isReady && isLessonCompleted(lesson.slug) ? 1 : 0),
    0
  );
  const isModuleComplete =
    isReady && coreLessons.length > 0 ? coreCompletedCount === coreLessons.length : false;
  const progressLabel =
    coreLessons.length > 0
      ? `${coreCompletedCount}/${coreLessons.length} core`
      : `${extraCompletedCount}/${extraLessons.length} extra`;
  const isActiveExtra = extraLessons.some((lesson) => lesson.slug === currentLessonSlug);

  return {
    coreLessons,
    extraLessons,
    extraCompletedCount,
    isModuleComplete,
    progressLabel,
    isActiveExtra,
  };
};

/**
 * Summarize visible module progress into core/extra completion counters.
 */
export const summarizeVisibleLessonProgress = ({
  modules,
  isReady,
  isLessonCompleted,
}: {
  modules: RoadmapModule[];
  isReady: boolean;
  isLessonCompleted: (lessonSlug: string) => boolean;
}) => {
  const allLessons = modules.flatMap((module) => module.lessons);
  let coreCompleted = 0;
  let extraCompleted = 0;
  let coreTotal = 0;
  let extraTotal = 0;

  for (const lesson of allLessons) {
    const isExtra = isExtraCreditLesson(lesson);
    const completed = isReady && isLessonCompleted(lesson.slug);

    if (isExtra) {
      extraTotal += 1;
      extraCompleted += completed ? 1 : 0;
    } else {
      coreTotal += 1;
      coreCompleted += completed ? 1 : 0;
    }
  }

  return {
    coreCompleted,
    coreTotal,
    extraCompleted,
    extraTotal,
  };
};
