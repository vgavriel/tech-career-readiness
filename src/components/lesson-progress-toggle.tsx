"use client";

import { useProgress } from "@/components/progress-provider";

type LessonProgressToggleProps = {
  lessonKey: string;
  legacyLessonId?: string;
};

export default function LessonProgressToggle({
  lessonKey,
  legacyLessonId,
}: LessonProgressToggleProps) {
  const { isLessonCompleted, isReady, isMerging, setLessonCompletion } =
    useProgress();
  const completed = isReady && isLessonCompleted(lessonKey, legacyLessonId);
  const disabled = !isReady || isMerging;
  const label = !isReady
    ? "Loading..."
    : completed
      ? "Mark incomplete"
      : "Mark complete";

  return (
    <button
      type="button"
      className={`rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-[var(--shadow-soft)] transition disabled:cursor-not-allowed disabled:opacity-60 ${
        completed
          ? "border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-900)] hover:border-[color:var(--ink-900)]"
          : "bg-[color:var(--accent-700)] text-[color:var(--wash-0)] hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)]"
      }`}
      disabled={disabled}
      onClick={() => setLessonCompletion(lessonKey, !completed)}
      aria-pressed={completed}
      aria-label={label}
    >
      {label}
    </button>
  );
}
