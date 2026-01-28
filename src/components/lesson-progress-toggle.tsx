"use client";

import { useProgress } from "@/components/progress-provider";

/**
 * Props for the lesson progress toggle button.
 */
type LessonProgressToggleProps = {
  lessonSlug: string;
};

/**
 * Toggle completion state for a lesson with error feedback.
 */
export default function LessonProgressToggle({ lessonSlug }: LessonProgressToggleProps) {
  const {
    isLessonCompleted,
    isReady,
    isMerging,
    progressError,
    clearProgressError,
    setLessonCompletion,
  } = useProgress();
  const completed = isReady && isLessonCompleted(lessonSlug);
  const disabled = !isReady || isMerging;
  const label = !isReady ? "Loading..." : completed ? "Mark incomplete" : "Mark complete";
  const errorMessage = progressError?.source === "toggle" ? progressError.message : null;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold shadow-[var(--shadow-soft)] transition disabled:cursor-not-allowed disabled:opacity-60 ${
          completed
            ? "border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-900)] hover:border-[color:var(--ink-900)]"
            : "bg-[color:var(--accent-700)] text-[color:var(--wash-0)] hover:bg-[color:var(--ink-800)]"
        }`}
        disabled={disabled}
        onClick={() => setLessonCompletion(lessonSlug, !completed, "toggle")}
        aria-pressed={completed}
        aria-label={label}
      >
        {label}
      </button>
      {errorMessage ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-2 text-sm text-[color:var(--ink-700)]"
          role="status"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={clearProgressError}
            className="text-[color:var(--ink-900)] underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
