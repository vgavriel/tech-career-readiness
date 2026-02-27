import type { FocusKey } from "@/lib/focus-options";
import { orderModulesForFocus } from "@/lib/focus-order";
import {
  buildOrderedLessons,
  buildProgressSummaryFromLessons,
  type ProgressSummaryLesson,
  splitLessonsByCredit,
} from "@/lib/progress-summary";
import type { RoadmapModule } from "@/lib/roadmap-types";

/**
 * CTA state shown at the bottom of a lesson page.
 */
export type LessonNextCoreCtaState =
  | { kind: "hidden" }
  | { kind: "complete" }
  | {
      kind: "lesson";
      lesson: ProgressSummaryLesson;
      variant: "next" | "catch-up";
    };

/**
 * Full CTA decision used by the lesson next-core component.
 */
export type LessonNextCoreCtaDecision = {
  ctaState: LessonNextCoreCtaState;
  restartLesson: ProgressSummaryLesson | null;
};

/**
 * Build next-core CTA decision from modules, focus, and completion state.
 */
export const buildLessonNextCoreCtaDecision = ({
  modules,
  focusKey,
  currentLessonSlug,
  completedLessonSlugs,
  isReady,
}: {
  modules: RoadmapModule[];
  focusKey: FocusKey | null;
  currentLessonSlug: string;
  completedLessonSlugs: string[];
  isReady: boolean;
}): LessonNextCoreCtaDecision => {
  const orderedModules = orderModulesForFocus(modules, focusKey);
  const orderedLessons = buildOrderedLessons(orderedModules);
  const { coreLessons } = splitLessonsByCredit(orderedLessons);
  const restartLesson = coreLessons[0] ?? null;
  const currentIndex = coreLessons.findIndex((lesson) => lesson.slug === currentLessonSlug);
  const completedSet = new Set(completedLessonSlugs);

  if (currentIndex >= 0) {
    const isLastCoreLesson = currentIndex === coreLessons.length - 1;
    if (isLastCoreLesson) {
      const remainingLessons = coreLessons.filter(
        (lesson) => lesson.slug !== currentLessonSlug && !completedSet.has(lesson.slug)
      );

      if (remainingLessons.length === 0) {
        return { ctaState: { kind: "complete" }, restartLesson };
      }

      return {
        ctaState: {
          kind: "lesson",
          lesson: remainingLessons[0],
          variant: "catch-up",
        },
        restartLesson,
      };
    }

    const nextLesson = coreLessons[currentIndex + 1];
    return {
      ctaState: nextLesson
        ? { kind: "lesson", lesson: nextLesson, variant: "next" }
        : { kind: "hidden" },
      restartLesson,
    };
  }

  if (coreLessons.length === 0) {
    return { ctaState: { kind: "hidden" }, restartLesson: null };
  }

  const summary = buildProgressSummaryFromLessons(coreLessons, completedSet, isReady);
  if (summary.allComplete) {
    return { ctaState: { kind: "complete" }, restartLesson };
  }

  const candidate = summary.continueLesson ?? summary.firstLesson ?? null;

  if (!candidate || candidate.slug === currentLessonSlug) {
    return { ctaState: { kind: "hidden" }, restartLesson };
  }

  return { ctaState: { kind: "lesson", lesson: candidate, variant: "next" }, restartLesson };
};
