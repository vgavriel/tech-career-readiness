"use client";

import Link from "next/link";

import { useProgress } from "@/components/progress-provider";

export type RoleLibraryLesson = {
  id: string;
  key: string;
  slug: string;
  title: string;
};

type RoleLibraryListProps = {
  lessons: RoleLibraryLesson[];
};

export default function RoleLibraryList({ lessons }: RoleLibraryListProps) {
  const { isLessonCompleted, isReady } = useProgress();

  if (lessons.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--ink-700)] shadow-[var(--shadow-soft)]">
        Role deep dives will appear here once the library is loaded.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {lessons.map((lesson, index) => {
        const isCompleted =
          isReady && isLessonCompleted(lesson.key, lesson.id);

        return (
          <article
            key={lesson.id}
            className="group flex flex-col gap-4 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] animate-fade"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[color:var(--ink-500)] ${
                    isCompleted
                      ? "border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]"
                      : "border-[color:var(--line-soft)] bg-[color:var(--wash-0)]"
                  }`}
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
                  ) : (
                    <span className="sr-only">Incomplete role deep dive</span>
                  )}
                </span>
                <span className="sr-only">Role deep dive</span>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${
                  isCompleted
                    ? "border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]"
                    : "border-[color:var(--accent-500)] bg-[color:var(--accent-500)] text-[color:var(--ink-900)]"
                }`}
              >
                {isCompleted ? "Completed" : "Extra credit"}
              </span>
            </div>
            <Link
              href={`/lesson/${lesson.slug}`}
              className="font-display text-lg text-[color:var(--ink-900)] transition group-hover:text-[color:var(--accent-700)]"
            >
              {lesson.title}
            </Link>
          </article>
        );
      })}
    </div>
  );
}
