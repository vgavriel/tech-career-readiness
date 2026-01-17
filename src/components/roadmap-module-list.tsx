"use client";

import Link from "next/link";

import { useProgress } from "@/components/progress-provider";

/**
 * Lesson metadata required for the roadmap listing.
 */
export type RoadmapLesson = {
  id: string;
  key: string;
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
};

/**
 * Render the roadmap module list with progress status indicators.
 *
 * @remarks
 * Presents ordered modules/lessons and reflects completion from progress
 * context; no side effects.
 */
export default function RoadmapModuleList({ modules }: RoadmapModuleListProps) {
  const { isLessonCompleted, isReady } = useProgress();

  if (modules.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--ink-700)] shadow-[var(--shadow-soft)]">
        Modules will appear here once the curriculum is loaded.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {modules.map((module, moduleIndex) => (
        <section
          key={module.id}
          className="relative overflow-hidden rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-7 shadow-[var(--shadow-card)] md:p-9 animate-fade"
          style={{ animationDelay: `${moduleIndex * 90}ms` }}
        >
          <div className="absolute -right-12 top-6 h-28 w-28 rounded-full bg-[color:var(--accent-500)] opacity-20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                  Module {module.order}
                </p>
                <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-900)]">
                  {module.lessons.length} lessons
                </span>
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

            <ol className="grid gap-4">
              {module.lessons.map((lesson, lessonIndex) => {
                const isCompleted =
                  isReady && isLessonCompleted(lesson.key, lesson.id);

                return (
                  <li
                    key={lesson.id}
                    className="group flex flex-col gap-3 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-5 py-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] sm:flex-row sm:items-center sm:justify-between animate-fade"
                    style={{ animationDelay: `${lessonIndex * 70}ms` }}
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
                        href={`/lesson/${lesson.slug}`}
                        className="text-sm font-semibold text-[color:var(--ink-900)] transition group-hover:text-[color:var(--accent-700)] md:text-base"
                      >
                        {lesson.title}
                      </Link>
                    </div>
                    {lesson.estimatedMinutes ? (
                      <span className="self-start text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)] sm:self-auto">
                        {lesson.estimatedMinutes} min
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}
