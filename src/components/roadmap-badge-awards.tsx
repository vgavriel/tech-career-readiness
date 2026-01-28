"use client";

import { useMemo } from "react";

import { useProgress } from "@/components/progress-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import { buildBadgeStatuses } from "@/lib/badges";

/**
 * Props for the badge awards panel.
 */
type RoadmapBadgeAwardsProps = {
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
 * Render earned and in-progress badge cards based on completion.
 */
export default function RoadmapBadgeAwards({ modules }: RoadmapBadgeAwardsProps) {
  const { completedLessonSlugs, isReady } = useProgress();
  const badges = useMemo(
    () => (isReady ? buildBadgeStatuses(modules, completedLessonSlugs) : []),
    [completedLessonSlugs, isReady, modules]
  );
  const sortedBadges = useMemo(() => {
    const earned = badges.filter((badge) => badge.isEarned);
    const inProgress = badges.filter((badge) => !badge.isEarned);
    return [...inProgress, ...earned];
  }, [badges]);
  const earnedCount = badges.filter((badge) => badge.isEarned).length;
  const earnedBadges = sortedBadges.filter((badge) => badge.isEarned);
  const inProgressBadges = sortedBadges.filter((badge) => !badge.isEarned);
  const totalLabel = badges.length === 1 ? "star" : "stars";

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
          {earnedCount} of {badges.length} {totalLabel} earned
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StarIcon variant="filled" className="text-[color:var(--accent-500)]" />
              <p className="text-sm font-semibold text-[color:var(--ink-800)]">Earned</p>
            </div>
            <span className="text-sm text-[color:var(--ink-500)]">{earnedBadges.length}</span>
          </div>
          {earnedBadges.length ? (
            <div className="grid gap-3">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.key}
                  className="flex flex-col gap-3 rounded-2xl border border-[color:var(--accent-700)] bg-[color:var(--wash-0)] px-4 py-3 shadow-[var(--shadow-soft)]"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[color:var(--ink-500)]">
                      {badge.title}
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                      {badge.description}
                    </p>
                  </div>
                  <p className="text-sm text-[color:var(--ink-500)]">{badge.progressLabel}</p>
                </div>
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
            <span className="text-sm text-[color:var(--ink-500)]">{inProgressBadges.length}</span>
          </div>
          <div className="grid gap-3">
            {inProgressBadges.map((badge) => (
              <div
                key={badge.key}
                className="flex flex-col gap-2 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-4 py-3 shadow-[var(--shadow-soft)]"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[color:var(--ink-500)]">{badge.title}</p>
                  <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                    {badge.description}
                  </p>
                </div>
                <p className="text-sm text-[color:var(--ink-500)]">{badge.progressLabel}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
