"use client";

import Link from "next/link";

import { useProgress } from "@/components/progress-provider";
import { FOCUS_QUERY_PARAM, type FocusKey } from "@/lib/focus-options";
import { isExtraCreditLesson } from "@/lib/lesson-classification";

/**
 * Lesson metadata required for the roadmap listing.
 */
export type RoadmapLesson = {
  id: string;
  slug: string;
  title: string;
  order: number;
  estimatedMinutes: number | null;
};

/**
 * Module metadata required for the roadmap listing.
 */
export type RoadmapModule = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  order: number;
  lessons: RoadmapLesson[];
};

/**
 * Props for the module list component.
 */
type RoadmapModuleListProps = {
  modules: RoadmapModule[];
  focusKey?: FocusKey | null;
};

/**
 * Render the roadmap module list with progress status indicators.
 *
 * @remarks
 * Presents ordered modules/lessons and reflects completion from progress
 * context; no side effects.
 */
export default function RoadmapModuleList({
  modules,
  focusKey = null,
}: RoadmapModuleListProps) {
  const { isLessonCompleted, isReady } = useProgress();
  const focusQuery = focusKey ? `?${FOCUS_QUERY_PARAM}=${focusKey}` : "";

  if (modules.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--ink-700)] shadow-[var(--shadow-soft)]">
        Modules will appear here once the curriculum is loaded.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {modules.map((module) => {
        const coreLessons = module.lessons.filter(
          (lesson) => !isExtraCreditLesson(lesson)
        );
        const extraLessons = module.lessons.filter((lesson) =>
          isExtraCreditLesson(lesson)
        );
        const hasCore = coreLessons.length > 0;
        const hasExtra = extraLessons.length > 0;
        const coreCompleted = coreLessons.reduce(
          (count, lesson) =>
            count + (isReady && isLessonCompleted(lesson.slug) ? 1 : 0),
          0
        );
        const extraCompleted = extraLessons.reduce(
          (count, lesson) =>
            count + (isReady && isLessonCompleted(lesson.slug) ? 1 : 0),
          0
        );

        const renderLessons = (lessons: RoadmapLesson[]) => (
          <ol className="grid gap-3">
            {lessons.map((lesson) => {
              const isCompleted = isReady && isLessonCompleted(lesson.slug);

              return (
                <li
                  key={lesson.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-3 shadow-[var(--shadow-soft)] transition hover:border-[color:var(--line-strong)] sm:flex-row sm:items-center sm:justify-between animate-fade"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border text-[color:var(--ink-500)] ${
                        isCompleted
                          ? "border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]"
                          : "border-[color:var(--line-soft)] bg-[color:var(--wash-0)]"
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <span className="sr-only">Completed lesson</span>
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
                        </>
                      ) : (
                        <span className="sr-only">Incomplete lesson</span>
                      )}
                    </span>
                    <span className="text-xs font-semibold text-[color:var(--ink-500)]">
                      {module.order}.{lesson.order}
                    </span>
                    <Link
                      href={`/lesson/${lesson.slug}${focusQuery}`}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-[color:var(--ink-900)] transition group-hover:text-[color:var(--accent-700)] md:text-base"
                    >
                      {lesson.title}
                    </Link>
                  </div>
                  {lesson.estimatedMinutes ? (
                    <span className="self-start text-xs font-semibold text-[color:var(--ink-500)] sm:self-auto">
                      {lesson.estimatedMinutes} min
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        );

        return (
          <section
            key={module.id}
            className="relative overflow-hidden rounded-[28px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-7 shadow-[var(--shadow-card)] md:p-8 animate-fade"
          >
            <div className="relative space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-semibold text-[color:var(--ink-500)]">
                    Module {module.order}
                  </p>
                  {hasCore ? (
                    <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-700)]">
                      {coreLessons.length} core
                    </span>
                  ) : (
                    <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-700)]">
                      Extra credit only
                    </span>
                  )}
                  {hasExtra ? (
                    <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-700)]">
                      {hasCore
                        ? `+${extraLessons.length} extra`
                        : `${extraLessons.length} lessons`}
                    </span>
                  ) : null}
                </div>
                <h2 className="font-display text-2xl text-[color:var(--ink-900)] md:text-3xl">
                  {module.title}
                </h2>
                {module.description ? (
                  <p className="max-w-2xl text-sm text-[color:var(--ink-700)] md:text-base">
                    {module.description}
                  </p>
                ) : null}
              </div>

              <div className="space-y-4">
                {hasCore ? (
                  <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[color:var(--ink-500)]">
                      <span>Core lessons</span>
                      <span>
                        {isReady
                          ? `${coreCompleted} of ${coreLessons.length} complete`
                          : "Loading progress"}
                      </span>
                    </div>
                    <div className="mt-4">{renderLessons(coreLessons)}</div>
                  </div>
                ) : null}

                {hasExtra ? (
                  hasCore ? (
                    <details className="group rounded-2xl border border-dashed border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-5">
                      <summary className="summary-clean flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-[color:var(--ink-500)]">
                        <span>Extra credit (optional)</span>
                        <span className="flex items-center gap-2 text-[color:var(--ink-500)]">
                          {isReady
                            ? `${extraCompleted} of ${extraLessons.length} complete`
                            : "Loading progress"}
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4 transition group-open:rotate-180"
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
                        </span>
                      </summary>
                      <div className="mt-4">{renderLessons(extraLessons)}</div>
                    </details>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[color:var(--ink-500)]">
                        <span>Extra credit lessons</span>
                        <span>
                          {isReady
                            ? `${extraCompleted} of ${extraLessons.length} complete`
                            : "Loading progress"}
                        </span>
                      </div>
                      <div className="mt-4">{renderLessons(extraLessons)}</div>
                    </div>
                  )
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
