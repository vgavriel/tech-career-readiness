"use client";

import Link from "next/link";

import { useProgress } from "@/components/progress-provider";

export type RoleLibraryLesson = {
  id: string;
  slug: string;
  title: string;
};

type RoleLibraryListProps = {
  lessons: RoleLibraryLesson[];
};

export default function RoleLibraryList({ lessons }: RoleLibraryListProps) {
  const { isLessonCompleted, isReady } = useProgress();
  const isLoading = !isReady;

  if (lessons.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--ink-700)] shadow-[var(--shadow-soft)]">
        Role deep dives will appear here once the library is loaded.
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 md:grid-cols-2"
      aria-busy={isLoading}
      aria-live="polite"
    >
      {lessons.map((lesson) => {
        const isCompleted = isReady && isLessonCompleted(lesson.slug);
        const showLoading = isLoading;
        const statusLabel = showLoading
          ? "Loading progress"
          : isCompleted
            ? "Completed"
            : "Extra credit";
        const statusStyles = showLoading
          ? "border-[color:var(--line-soft)] bg-[color:var(--wash-50)] text-[color:var(--ink-600)]"
          : isCompleted
            ? "border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]"
            : "border-[color:var(--line-soft)] bg-[color:var(--wash-50)] text-[color:var(--ink-700)]";
        const iconStyles = showLoading
          ? "border-[color:var(--line-soft)] bg-[color:var(--wash-50)] text-[color:var(--ink-500)]"
          : isCompleted
            ? "border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]"
            : "border-[color:var(--line-soft)] bg-[color:var(--wash-0)]";

        return (
          <Link
            key={lesson.id}
            href={`/lesson/${lesson.slug}`}
            className="no-underline group block rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-4 shadow-[var(--shadow-soft)] transition hover:border-[color:var(--line-strong)] animate-fade"
          >
            <article className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${iconStyles}`}
                  >
                    {isCompleted ? (
                      <>
                        <span className="sr-only">Completed role deep dive</span>
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
                    ) : showLoading ? (
                      <span className="sr-only">Loading role progress</span>
                    ) : (
                      <span className="sr-only">Incomplete role deep dive</span>
                    )}
                  </span>
                  <span className="sr-only">Role deep dive</span>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles}`}
                >
                  {statusLabel}
                </span>
              </div>
              <span className="font-display text-lg text-[color:var(--ink-900)] transition group-hover:text-[color:var(--accent-700)]">
                {lesson.title}
              </span>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
