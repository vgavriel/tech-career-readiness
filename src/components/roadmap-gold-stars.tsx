"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import { buildGoldStarStatuses, type GoldStarStatus } from "@/lib/gold-stars";

/**
 * Props for the gold stars panel.
 */
type RoadmapGoldStarsProps = {
  modules: RoadmapModule[];
};

/**
 * Props for the star icon component.
 */
type StarIconProps = {
  variant: "filled" | "outline";
  className?: string;
};

/**
 * Render a filled or outlined star icon.
 */
const StarIcon = ({ variant, className = "" }: StarIconProps) => {
  const isFilled = variant === "filled";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${className}`}
    >
      <path
        d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9 6.8 19.5l1-5.8-4.2-4.1 5.8-.8L12 3.5z"
        fill={isFilled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={isFilled ? 1 : 1.5}
      />
    </svg>
  );
};

/**
 * Render earned and in-progress gold star cards based on completion.
 */
export default function RoadmapGoldStars({ modules }: RoadmapGoldStarsProps) {
  const { completedLessonSlugs, isReady } = useProgress();
  const goldStars = useMemo(
    () => (isReady ? buildGoldStarStatuses(modules, completedLessonSlugs) : []),
    [completedLessonSlugs, isReady, modules]
  );
  const sortedGoldStars = useMemo(() => {
    const earned = goldStars.filter((star) => star.isEarned);
    const inProgress = goldStars.filter((star) => !star.isEarned);
    return [...inProgress, ...earned];
  }, [goldStars]);
  const earnedCount = goldStars.filter((star) => star.isEarned).length;
  const earnedStars = sortedGoldStars.filter((star) => star.isEarned);
  const inProgressStars = sortedGoldStars.filter((star) => !star.isEarned);
  const totalLabel = goldStars.length === 1 ? "star" : "stars";

  if (!isReady) {
    return (
      <section className="rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-[color:var(--ink-900)]">Gold Stars</h2>
          </div>
          <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-1 text-sm font-semibold text-[color:var(--ink-700)]">
            Loading progress...
          </span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4 text-sm text-[color:var(--ink-600)]">
            Loading earned stars...
          </div>
          <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4 text-sm text-[color:var(--ink-600)]">
            Loading stars in progress...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[color:var(--ink-900)]">Gold Stars</h2>
        </div>
        <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-1 text-sm font-semibold text-[color:var(--ink-700)]">
          {earnedCount} of {goldStars.length} {totalLabel} earned
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarIcon variant="filled" className="text-[color:var(--accent-500)]" />
              <p className="text-sm font-semibold text-[color:var(--ink-800)]">Earned</p>
            </div>
            <span className="text-sm text-[color:var(--ink-500)]">{earnedStars.length}</span>
          </div>
          {earnedStars.length ? (
            <div className="grid gap-3">
              {earnedStars.map((star) => (
                <GoldStarCard key={star.key} star={star} variant="earned" labelPrefix="Review" />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4 text-sm text-[color:var(--ink-600)]">
              Complete your first module to earn a gold star.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarIcon variant="outline" className="text-[color:var(--accent-500)]" />
              <p className="text-sm font-semibold text-[color:var(--ink-800)]">In progress</p>
            </div>
            <span className="text-sm text-[color:var(--ink-500)]">{inProgressStars.length}</span>
          </div>
          <div className="grid gap-3">
            {inProgressStars.map((star) => (
              <GoldStarCard
                key={star.key}
                star={star}
                variant="in-progress"
                labelPrefix="Continue"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type GoldStarCardProps = {
  star: GoldStarStatus;
  variant: "earned" | "in-progress";
  labelPrefix: string;
};

const GoldStarCard = ({ star, variant, labelPrefix }: GoldStarCardProps) => {
  const isClickable = Boolean(star.targetLessonSlug);
  const baseClasses =
    variant === "earned"
      ? "flex flex-col gap-3 rounded-2xl border border-[color:var(--accent-700)] bg-[color:var(--wash-0)] px-4 py-3 shadow-[var(--shadow-soft)]"
      : "flex flex-col gap-2 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-4 py-3 shadow-[var(--shadow-soft)]";
  const interactiveClasses = isClickable
    ? "no-underline cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
    : "";
  const ariaLabel = `${labelPrefix} ${star.title}`;

  const content = (
    <>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[color:var(--ink-500)]">{star.title}</p>
        <p className="text-sm font-semibold text-[color:var(--ink-900)]">{star.description}</p>
      </div>
      <p className="text-sm text-[color:var(--ink-500)]">{star.progressLabel}</p>
    </>
  );

  if (isClickable && star.targetLessonSlug) {
    return (
      <Link
        href={`/lesson/${star.targetLessonSlug}`}
        className={`${baseClasses} ${interactiveClasses}`}
        aria-label={ariaLabel}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
};
