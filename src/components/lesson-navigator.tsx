"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useFocus } from "@/components/focus-provider";
import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import SignInCta from "@/components/sign-in-cta";
import { orderModulesForFocus } from "@/lib/focus-order";
import { FOCUS_OPTIONS } from "@/lib/focus-options";
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
    setLessonCompletion,
  } = useProgress();
  const router = useRouter();

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

  const focusLabel = focusKey
    ? `Focus: ${
        FOCUS_OPTIONS.find((option) => option.key === focusKey)?.label ?? "Focus"
      }`
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

  return (
    <div className="flex h-full flex-col gap-3 px-3 pb-3 pt-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[color:var(--ink-900)]">
            {focusLabel}
          </p>
          {focusKey ? (
            <button
              type="button"
              onClick={() => {
                void setFocusKey(null);
              }}
              className="min-h-11 rounded-md border border-[color:var(--line-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-700)] transition hover:border-[color:var(--ink-900)]"
            >
              Clear focus
            </button>
          ) : null}
        </div>
        <div className="grid gap-2 rounded-lg border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-600)]">
          <div className="flex items-center justify-between">
            <span>Core progress</span>
            <span>
              {isReady ? `${coreCompleted} / ${coreTotal}` : "Loading"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Extra credit</span>
            <span>
              {isReady ? `${extraCompleted} / ${extraTotal}` : "Loading"}
            </span>
          </div>
        </div>
      </div>

      <div className="scroll-panel flex-1 overflow-y-auto">
        <div className="space-y-4">
          {visibleModules.map((module) => {
            const isActiveModule = module.key === currentModuleKey;
            const coreLessons = module.lessons.filter(
              (lesson) => !isExtraCreditLesson(lesson)
            );
            const extraLessonsCount = module.lessons.length - coreLessons.length;
            const coreCompletedCount = coreLessons.reduce(
              (count, lesson) =>
                count +
                (isReady && isLessonCompleted(lesson.slug) ? 1 : 0),
              0
            );
            const isModuleComplete =
              isReady && coreLessons.length > 0
                ? coreCompletedCount === coreLessons.length
                : false;
            const progressLabel =
              coreLessons.length > 0
                ? `${coreCompletedCount}/${coreLessons.length} core`
                : `${extraLessonsCount} extra`;

            return (
              <details
                key={module.id}
                open={isActiveModule}
                className="group rounded-lg border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] shadow-[var(--shadow-soft)]"
              >
                <summary className="summary-clean flex min-h-11 cursor-pointer items-center px-3 py-2">
                  <div className="flex w-full items-start gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
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
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      ) : null}
                      <span className="shrink-0 whitespace-nowrap rounded-md border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-600)]">
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 9l6 6 6-6"
                        />
                      </svg>
                    </div>
                  </div>
                </summary>
                <div className="space-y-2 px-3 pb-3">
                  {module.lessons.map((lesson) => {
                    const isActive = lesson.slug === currentLessonSlug;
                    const isCompleted = isReady && isLessonCompleted(lesson.slug);
                    const isExtra = isExtraCreditLesson(lesson);
                    const isDisabled = !isReady || isMerging;

                    return (
                      <div
                        key={lesson.id}
                        className={`flex min-h-11 items-stretch gap-2 rounded-md border px-2.5 py-2 text-sm transition ${
                          isActive
                            ? "border-[color:var(--accent-700)] bg-[color:var(--accent-500)] text-[color:var(--ink-900)]"
                            : "border-[color:var(--line-soft)] bg-[color:var(--wash-50)] text-[color:var(--ink-700)] hover:border-[color:var(--line-strong)]"
                        }`}
                      >
                        <Link
                          href={`/lesson/${lesson.slug}`}
                          className="no-underline flex flex-1 flex-col justify-center gap-1 py-1"
                          aria-current={isActive ? "page" : undefined}
                          id={buildLessonId(lesson.slug)}
                        >
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
                            <span>
                              {module.order}.{lesson.order}
                            </span>
                            {isExtra ? (
                              <span className="rounded-md border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-600)]">
                                Extra credit
                              </span>
                            ) : null}
                          </div>
                          <span className="text-sm font-semibold text-[color:var(--ink-900)]">
                            {lesson.title}
                          </span>
                        </Link>
                        <button
                          type="button"
                          className="flex h-11 w-11 items-center justify-center"
                          aria-pressed={isCompleted}
                          aria-label={
                            isCompleted
                              ? `Mark ${lesson.title} incomplete`
                              : `Mark ${lesson.title} complete`
                          }
                          disabled={isDisabled}
                          onClick={() =>
                            void setLessonCompletion(lesson.slug, !isCompleted)
                          }
                        >
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-[color:var(--ink-500)] ${
                              isCompleted
                                ? "border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]"
                                : "border-[color:var(--line-soft)] bg-[color:var(--wash-0)]"
                            }`}
                          >
                            {isCompleted ? (
                              <svg
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : null}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-2.5 text-xs text-[color:var(--ink-600)]">
        {isAuthenticated
          ? "Progress syncs to your account."
          : "Progress is saved in this browser until you sign in."}
        {isMerging ? " Syncing guest progress..." : ""}
      {!isAuthenticated ? (
        <SignInCta className="mt-3 inline-flex min-h-11 items-center px-3 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-700)]">
          Sign in to save progress
        </SignInCta>
      ) : null}
      </div>
    </div>
  );
}
