"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import { useFocus } from "@/components/focus-provider";
import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import SignInCta from "@/components/sign-in-cta";
import { FOCUS_OPTIONS } from "@/lib/focus-options";
import { orderModulesForFocus } from "@/lib/focus-order";
import { isExtraCreditLesson } from "@/lib/lesson-classification";

type LessonNavigatorProps = {
  modules: RoadmapModule[];
  currentLessonSlug: string;
  currentModuleKey: string | null;
};

const buildLessonId = (lessonSlug: string) =>
  `navigator-lesson-${lessonSlug.replace(/[^a-z0-9-]/gi, "-")}`;

export default function LessonNavigator({
  modules,
  currentLessonSlug,
  currentModuleKey,
}: LessonNavigatorProps) {
  const { focusKey, setFocusKey } = useFocus();
  const {
    isLessonCompleted,
    isReady,
    isAuthenticated,
    isMerging,
    progressError,
    clearProgressError,
    setLessonCompletion,
  } = useProgress();
  const router = useRouter();
  const scrollPanelRef = useRef<HTMLDivElement | null>(null);
  const lastScrollKeyRef = useRef<string | null>(null);

  const visibleModules = useMemo(
    () => orderModulesForFocus(modules, focusKey),
    [modules, focusKey]
  );

  const isCurrentModuleVisible = useMemo(() => {
    if (!focusKey || !currentModuleKey) {
      return true;
    }

    return visibleModules.some((module) => module.key === currentModuleKey);
  }, [currentModuleKey, focusKey, visibleModules]);

  useEffect(() => {
    if (!focusKey || isCurrentModuleVisible) {
      return;
    }

    const firstLesson = visibleModules[0]?.lessons[0];
    if (firstLesson && firstLesson.slug !== currentLessonSlug) {
      router.replace(`/lesson/${firstLesson.slug}`);
    }
  }, [currentLessonSlug, focusKey, isCurrentModuleVisible, router, visibleModules]);

  useEffect(() => {
    if (typeof window === "undefined" || !isCurrentModuleVisible) {
      return;
    }

    const scrollPanel = scrollPanelRef.current;
    if (!scrollPanel) {
      return;
    }

    const scrollKey = `${currentLessonSlug}-${focusKey ?? "all"}`;
    if (lastScrollKeyRef.current === scrollKey) {
      return;
    }

    const target = document.getElementById(buildLessonId(currentLessonSlug));
    if (!target) {
      return;
    }

    const panelRect = scrollPanel.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const isVisible = targetRect.top >= panelRect.top && targetRect.bottom <= panelRect.bottom;

    if (!isVisible) {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const nextTop =
        targetRect.top -
        panelRect.top +
        scrollPanel.scrollTop -
        panelRect.height / 2 +
        targetRect.height / 2;

      scrollPanel.scrollTo({
        top: Math.max(0, nextTop),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }

    lastScrollKeyRef.current = scrollKey;
  }, [currentLessonSlug, focusKey, isCurrentModuleVisible]);

  const focusLabel = focusKey
    ? `Focus: ${FOCUS_OPTIONS.find((option) => option.key === focusKey)?.label ?? "Focus"}`
    : "Full curriculum";

  const { coreCompleted, coreTotal, extraCompleted, extraTotal } = useMemo(() => {
    const allLessons = visibleModules.flatMap((module) => module.lessons);
    let coreCompletedCount = 0;
    let extraCompletedCount = 0;
    let coreCount = 0;
    let extraCount = 0;

    for (const lesson of allLessons) {
      const isExtra = isExtraCreditLesson(lesson);
      const completed = isReady && isLessonCompleted(lesson.slug);

      if (isExtra) {
        extraCount += 1;
        extraCompletedCount += completed ? 1 : 0;
      } else {
        coreCount += 1;
        coreCompletedCount += completed ? 1 : 0;
      }
    }

    return {
      coreCompleted: coreCompletedCount,
      coreTotal: coreCount,
      extraCompleted: extraCompletedCount,
      extraTotal: extraCount,
    };
  }, [isLessonCompleted, isReady, visibleModules]);

  const renderLessonRow = (
    lesson: RoadmapModule["lessons"][number],
    moduleOrder: number,
    options?: { showExtraTag?: boolean }
  ) => {
    const isActive = lesson.slug === currentLessonSlug;
    const isCompleted = isReady && isLessonCompleted(lesson.slug);
    const isExtra = isExtraCreditLesson(lesson);
    const isDisabled = !isReady || isMerging;
    const metaTextColor = isActive ? "text-[color:var(--ink-700)]" : "text-[color:var(--ink-600)]";

    return (
      <div
        key={lesson.id}
        className={`flex min-h-11 items-stretch gap-2 rounded-xl border px-3 py-2 text-sm transition ${
          isActive
            ? "border-[color:var(--accent-700)] bg-[color:var(--accent-300)] text-[color:var(--ink-900)]"
            : "border-[color:var(--line-soft)] bg-[color:var(--wash-50)] text-[color:var(--ink-700)] hover:border-[color:var(--line-strong)]"
        }`}
      >
        <Link
          href={`/lesson/${lesson.slug}`}
          className="no-underline flex flex-1 flex-wrap items-center gap-2 py-1"
          aria-current={isActive ? "page" : undefined}
          id={buildLessonId(lesson.slug)}
        >
          <span className="text-sm font-semibold text-[color:var(--ink-900)]">
            <span className={`text-sm font-semibold ${metaTextColor}`}>
              {moduleOrder}.{lesson.order}
            </span>{" "}
            {lesson.title}
          </span>
          {options?.showExtraTag && isExtra ? (
            <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-2 py-0.5 text-sm font-semibold text-[color:var(--ink-600)]">
              Extra credit
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isCompleted
              ? "border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]"
              : "border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-600)]"
          }`}
          aria-pressed={isCompleted}
          aria-label={
            isCompleted ? `Mark ${lesson.title} incomplete` : `Mark ${lesson.title} complete`
          }
          disabled={isDisabled}
          onClick={() => void setLessonCompletion(lesson.slug, !isCompleted, "navigator")}
        >
          {isCompleted ? (
            <svg
              aria-hidden="true"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </button>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-4 px-4 pb-4 pt-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[color:var(--ink-900)]">{focusLabel}</p>
          {focusKey ? (
            <button
              type="button"
              onClick={() => {
                void setFocusKey(null);
              }}
              className="min-h-10 rounded-full border border-[color:var(--line-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--ink-700)] transition hover:border-[color:var(--ink-900)]"
            >
              Clear focus
            </button>
          ) : null}
        </div>
        <div className="grid gap-2 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-3 text-sm text-[color:var(--ink-600)]">
          <div className="flex items-center justify-between">
            <span>Core progress</span>
            <span>{isReady ? `${coreCompleted} / ${coreTotal}` : "Loading"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Extra credit</span>
            <span>{isReady ? `${extraCompleted} / ${extraTotal}` : "Loading"}</span>
          </div>
        </div>
      </div>

      <div ref={scrollPanelRef} className="scroll-panel flex-1 overflow-y-auto">
        <div className="space-y-4">
          {visibleModules.map((module) => {
            const isActiveModule = module.key === currentModuleKey;
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

            return (
              <details
                key={module.id}
                open={isActiveModule}
                className="group rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] shadow-[var(--shadow-soft)]"
              >
                <summary className="summary-clean flex min-h-11 cursor-pointer items-center px-3 py-3">
                  <div className="flex w-full items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--ink-500)]">
                        Module {module.order}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--ink-900)]">
                        {module.title}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {isModuleComplete ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]">
                          <span className="sr-only">Module completed</span>
                          <svg
                            aria-hidden="true"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : null}
                      <span className="shrink-0 whitespace-nowrap rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-2.5 py-0.5 text-sm font-semibold text-[color:var(--ink-600)]">
                        {isReady ? progressLabel : "Loading"}
                      </span>
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4 text-[color:var(--ink-500)] transition group-open:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </summary>
                <div className="space-y-3 px-3 pb-3">
                  {coreLessons.length ? (
                    <div className="space-y-2">
                      {coreLessons.map((lesson) => renderLessonRow(lesson, module.order))}
                    </div>
                  ) : null}
                  {extraLessons.length ? (
                    <details
                      open={isActiveExtra || coreLessons.length === 0}
                      className="extra-credit-details rounded-xl border border-dashed border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-2"
                    >
                      <summary className="summary-clean flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-[color:var(--ink-600)]">
                        <span>Extra credit</span>
                        <span className="flex items-center gap-2 text-[color:var(--ink-500)]">
                          {isReady ? `${extraCompletedCount} / ${extraLessons.length}` : "Loading"}
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4 transition"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                          </svg>
                        </span>
                      </summary>
                      <div className="mt-2 space-y-2 pb-2">
                        {extraLessons.map((lesson) => renderLessonRow(lesson, module.order))}
                      </div>
                    </details>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-3 text-sm text-[color:var(--ink-600)]">
        {isAuthenticated
          ? "Progress syncs to your account."
          : "Progress is saved locally in browser."}
        {isMerging ? " Syncing guest progress..." : ""}
        {!isAuthenticated ? (
          <SignInCta className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[color:var(--accent-700)] text-[color:var(--wash-0)] hover:bg-[color:var(--ink-800)] px-3 text-sm font-semibold text-[color:var(--ink-700)] transition hover:border-[color:var(--ink-900)]">
            Sign in to save to your account.
          </SignInCta>
        ) : null}
      </div>
      {progressError?.source === "navigator" ? (
        <div
          className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-3 text-sm text-[color:var(--ink-700)]"
          role="status"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{progressError.message}</span>
            <button
              type="button"
              onClick={clearProgressError}
              className="text-[color:var(--ink-900)] underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
