"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useFocus } from "@/components/focus-provider";
import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import { orderModulesForFocus } from "@/lib/focus-order";
import {
  buildOrderedLessons,
  buildProgressSummaryFromLessons,
  type ProgressSummaryLesson,
  splitLessonsByCredit,
} from "@/lib/progress-summary";

/**
 * Props for the next core lesson CTA.
 */
type LessonNextCoreCtaProps = {
  modules: RoadmapModule[];
  currentLessonSlug: string;
};

type LessonNextCoreCtaState =
  | { kind: "hidden" }
  | { kind: "complete" }
  | {
      kind: "lesson";
      lesson: ProgressSummaryLesson;
      variant: "next" | "catch-up";
    };

/**
 * Render a focus-aware CTA that jumps to the next core lesson.
 */
export default function LessonNextCoreCta({ modules, currentLessonSlug }: LessonNextCoreCtaProps) {
  const { focusKey } = useFocus();
  const { completedLessonSlugs, isReady, setLessonCompletion } = useProgress();

  const ctaState = useMemo<LessonNextCoreCtaState>(() => {
    const orderedModules = orderModulesForFocus(modules, focusKey);
    const orderedLessons = buildOrderedLessons(orderedModules);
    const { coreLessons } = splitLessonsByCredit(orderedLessons);
    const currentIndex = coreLessons.findIndex((lesson) => lesson.slug === currentLessonSlug);

    if (currentIndex >= 0) {
      const isLastCoreLesson = currentIndex === coreLessons.length - 1;
      if (isLastCoreLesson) {
        const completedSet = new Set(completedLessonSlugs);
        const remainingLessons = coreLessons.filter(
          (lesson) => lesson.slug !== currentLessonSlug && !completedSet.has(lesson.slug)
        );

        if (remainingLessons.length === 0) {
          return { kind: "complete" };
        }

        return {
          kind: "lesson",
          lesson: remainingLessons[0],
          variant: "catch-up",
        };
      }

      const nextLesson = coreLessons[currentIndex + 1];
      return nextLesson
        ? { kind: "lesson", lesson: nextLesson, variant: "next" }
        : { kind: "hidden" };
    }

    if (coreLessons.length === 0) {
      return { kind: "hidden" };
    }

    const completedSet = new Set(completedLessonSlugs);
    const summary = buildProgressSummaryFromLessons(coreLessons, completedSet, isReady);
    if (summary.allComplete) {
      return { kind: "hidden" };
    }

    const candidate = summary.continueLesson ?? summary.firstLesson ?? null;

    if (!candidate || candidate.slug === currentLessonSlug) {
      return { kind: "hidden" };
    }

    return { kind: "lesson", lesson: candidate, variant: "next" };
  }, [completedLessonSlugs, currentLessonSlug, focusKey, isReady, modules]);

  if (ctaState.kind === "hidden") {
    return null;
  }

  const nextLesson = ctaState.kind === "lesson" ? ctaState.lesson : null;
  const metaLabel = nextLesson
    ? `Module ${nextLesson.moduleOrder} - Lesson ${nextLesson.order}`
    : "";
  const nextHref = nextLesson ? `/lesson/${nextLesson.slug}` : "";
  const desktopMessage =
    ctaState.kind === "complete"
      ? "You reached the end of the core course."
      : ctaState.variant === "catch-up"
        ? `Finish remaining core lessons: ${metaLabel} - ${nextLesson?.title ?? ""}`
        : `Up Next: ${metaLabel} - ${nextLesson?.title ?? ""}`;
  const mobileEyebrow =
    ctaState.kind === "complete"
      ? "Core course complete"
      : ctaState.variant === "catch-up"
        ? "Finish core lessons"
        : "Up next";
  const mobileTitle =
    ctaState.kind === "complete"
      ? "You reached the end of the core course."
      : (nextLesson?.title ?? "");
  const buttonLabel =
    ctaState.kind === "lesson"
      ? ctaState.variant === "catch-up"
        ? "Finish core lessons"
        : "Next core lesson"
      : "";
  const shouldMarkComplete = !completedLessonSlugs.includes(currentLessonSlug);
  const handleNextClick = () => {
    if (!shouldMarkComplete) {
      return;
    }
    void setLessonCompletion(currentLessonSlug, true, "navigator");
  };

  return (
    <>
      <div className="hidden md:block">
        <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-5 py-4 shadow-[var(--shadow-card)] md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <p
              className={`min-w-0 text-md font-semibold text-[color:var(--ink-700)] ${
                ctaState.kind === "complete" ? "whitespace-normal" : "truncate"
              }`}
            >
              {desktopMessage}
            </p>
            {ctaState.kind === "lesson" ? (
              <Link
                href={nextHref}
                onClick={handleNextClick}
                className="no-underline inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-700)] px-4 py-2 text-sm font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)]"
              >
                {buttonLabel}
              </Link>
            ) : null}
          </div>
        </div>
        <div aria-hidden="true" className="h-6" />
      </div>

      <div className="md:hidden sticky bottom-0 z-10">
        <div className="w-full">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] px-4 py-3 shadow-[var(--shadow-card)]">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
                {mobileEyebrow}
              </p>
              <p
                className={`text-sm font-semibold text-[color:var(--ink-900)] ${
                  ctaState.kind === "complete" ? "whitespace-normal leading-snug" : "truncate"
                }`}
              >
                {mobileTitle}
              </p>
            </div>
            {ctaState.kind === "lesson" ? (
              <Link
                href={nextHref}
                onClick={handleNextClick}
                className="no-underline inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-700)] px-4 py-2 text-sm font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)]"
              >
                {ctaState.variant === "catch-up" ? "Finish" : "Next"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
