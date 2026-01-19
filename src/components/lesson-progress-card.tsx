"use client";

import { useProgress } from "@/components/progress-provider";
import SignInCta from "@/components/sign-in-cta";

/**
 * Props for the lesson progress control card.
 */
type LessonProgressCardProps = {
  lessonSlug: string;
  lessonTitle: string;
};

/**
 * Render lesson completion controls and status messaging.
 *
 * @remarks
 * Provides a focused CTA to mark completion while reflecting merge/loading
 * state from progress context.
 */
export default function LessonProgressCard({
  lessonSlug,
  lessonTitle,
}: LessonProgressCardProps) {
  const {
    isLessonCompleted,
    isAuthenticated,
    isMerging,
    isReady,
    setLessonCompletion,
  } = useProgress();
  const completed = isReady && isLessonCompleted(lessonSlug);
  const disabled = !isReady || isMerging;
  const statusLabel = !isReady
    ? "Loading progress..."
    : completed
      ? "Marked complete"
      : "Not completed yet";

  const helperText = isAuthenticated
    ? "Saved to your account."
    : "Stored in this browser. Sign in to sync.";

  return (
    <div className="rounded-[24px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-6 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
        Progress
      </p>
      <p className="mt-3 text-sm font-semibold text-[color:var(--ink-900)]">
        {lessonTitle}
      </p>
      <p className="mt-1 text-xs text-[color:var(--ink-500)]">{statusLabel}</p>

      <button
        className={`mt-4 w-full rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] shadow-[var(--shadow-soft)] transition disabled:cursor-not-allowed disabled:opacity-60 ${
          completed
            ? "border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-900)] hover:border-[color:var(--ink-900)]"
            : "bg-[color:var(--accent-700)] text-[color:var(--wash-0)] hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)]"
        }`}
        disabled={disabled}
        onClick={() => setLessonCompletion(lessonSlug, !completed)}
        type="button"
        aria-pressed={completed}
      >
        {completed ? "Mark incomplete" : "Mark complete"}
      </button>

      <p className="mt-3 text-xs text-[color:var(--ink-500)]">
        {helperText}
      </p>

      {isMerging ? (
        <p className="mt-2 text-xs text-[color:var(--ink-500)]">
          Syncing guest progress...
        </p>
      ) : null}

      {!isAuthenticated ? (
        <SignInCta
          className="mt-3 inline-flex text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-700)]"
        >
          Sign in to save progress
        </SignInCta>
      ) : null}
    </div>
  );
}
