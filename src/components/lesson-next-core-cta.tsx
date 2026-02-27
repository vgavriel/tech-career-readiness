"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useFocus } from "@/components/focus-provider";
import { useProgress } from "@/components/progress-provider";
import { buildLessonNextCoreCtaDecision } from "@/lib/lesson-next-core-cta";
import type { RoadmapModule } from "@/lib/roadmap-types";

/**
 * Props for the next core lesson CTA.
 */
type LessonNextCoreCtaProps = {
  modules: RoadmapModule[];
  currentLessonSlug: string;
};

/**
 * Render a focus-aware CTA that jumps to the next core lesson.
 */
export default function LessonNextCoreCta({ modules, currentLessonSlug }: LessonNextCoreCtaProps) {
  const { focusKey } = useFocus();
  const { completedLessonSlugs, isReady, setLessonCompletion } = useProgress();

  const { ctaState, restartLesson } = useMemo(
    () =>
      buildLessonNextCoreCtaDecision({
        modules,
        focusKey,
        currentLessonSlug,
        completedLessonSlugs,
        isReady,
      }),
    [completedLessonSlugs, currentLessonSlug, focusKey, isReady, modules]
  );

  if (ctaState.kind === "hidden") {
    return null;
  }

  const nextLesson = ctaState.kind === "lesson" ? ctaState.lesson : null;
  const actionLesson = ctaState.kind === "lesson" ? nextLesson : restartLesson;
  const metaLabel = nextLesson
    ? `Module ${nextLesson.moduleOrder} - Lesson ${nextLesson.order}`
    : "";
  const actionHref = actionLesson ? `/lesson/${actionLesson.slug}` : "";
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
      : "Start course";
  const mobileButtonLabel =
    ctaState.kind === "lesson" ? (ctaState.variant === "catch-up" ? "Finish" : "Next") : "Start";
  const shouldMarkComplete =
    ctaState.kind === "lesson" && !completedLessonSlugs.includes(currentLessonSlug);
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
            {actionLesson ? (
              <Link
                href={actionHref}
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
            {actionLesson ? (
              <Link
                href={actionHref}
                onClick={handleNextClick}
                className="no-underline inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-700)] px-4 py-2 text-sm font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)]"
              >
                {mobileButtonLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
