"use client";

import { useProgress } from "@/components/progress-provider";

type LessonProgressToggleProps = {
  lessonSlug: string;
};

export default function LessonProgressToggle({
  lessonSlug,
}: LessonProgressToggleProps) {
  const { isLessonCompleted, isReady, isMerging, setLessonCompletion } =
    useProgress();
  const completed = isReady && isLessonCompleted(lessonSlug);
  const disabled = !isReady || isMerging;
  const label = !isReady
    ? "Loading..."
    : completed
      ? "Mark incomplete"
      : "Mark complete";

  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] shadow-[var(--shadow-soft)] transition disabled:cursor-not-allowed disabled:opacity-60 ${
        completed
          ? "border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-900)] hover:border-[color:var(--ink-900)]"
          : "bg-[color:var(--accent-700)] text-[color:var(--wash-0)] hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)]"
      }`}
      disabled={disabled}
      onClick={() => setLessonCompletion(lessonSlug, !completed)}
      aria-pressed={completed}
      aria-label={label}
    >
      {label}
    </button>
  );
}
