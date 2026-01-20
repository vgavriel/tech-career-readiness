"use client";

import { useMemo } from "react";

import type { RoadmapModule } from "@/components/roadmap-module-list";
import { useProgress } from "@/components/progress-provider";
import { buildBadgeStatuses } from "@/lib/badges";

type RoadmapBadgeAwardsProps = {
  modules: RoadmapModule[];
};

export default function RoadmapBadgeAwards({ modules }: RoadmapBadgeAwardsProps) {
  const { completedLessonSlugs } = useProgress();
  const badges = useMemo(
    () => buildBadgeStatuses(modules, completedLessonSlugs),
    [modules, completedLessonSlugs]
  );
  const sortedBadges = useMemo(() => {
    const earned = badges.filter((badge) => badge.isEarned);
    const inProgress = badges.filter((badge) => !badge.isEarned);
    return [...inProgress, ...earned];
  }, [badges]);
  const earnedCount = badges.filter((badge) => badge.isEarned).length;
  const primaryBadges = sortedBadges.slice(0, 3);
  const extraBadges = sortedBadges.slice(3);

  return (
    <section className="rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
            Badge awards
          </p>
          <h2 className="mt-2 font-display text-2xl text-[color:var(--ink-900)]">
            Momentum markers
          </h2>
        </div>
        <span className="rounded-md border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-900)]">
          {earnedCount} of {badges.length} earned
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {primaryBadges.map((badge) => (
          <div
            key={badge.key}
            className="flex flex-col gap-3 rounded-xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-2.5 shadow-[var(--shadow-soft)] animate-fade"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                  {badge.title}
                </p>
                <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                  {badge.description}
                </p>
              </div>
              <span
                className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.3em] ${
                  badge.isEarned
                    ? "border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]"
                    : "border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-700)]"
                }`}
              >
                {badge.statusLabel}
              </span>
            </div>
            <p className="text-xs text-[color:var(--ink-500)]">
              {badge.progressLabel}
            </p>
          </div>
        ))}
      </div>

      {extraBadges.length ? (
        <details className="group mt-4 rounded-xl border border-dashed border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-3">
          <summary className="summary-clean flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
            <span>View all badges</span>
            <span className="flex items-center gap-2">
              {extraBadges.length} more
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
          <div className="mt-3 grid gap-3">
            {extraBadges.map((badge) => (
              <div
                key={badge.key}
                className="flex flex-col gap-2 rounded-xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-2.5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                      {badge.title}
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                      {badge.description}
                    </p>
                  </div>
                  <span
                    className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.3em] ${
                      badge.isEarned
                        ? "border-[color:var(--accent-700)] bg-[color:var(--accent-700)] text-[color:var(--wash-0)]"
                        : "border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-700)]"
                    }`}
                  >
                    {badge.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-[color:var(--ink-500)]">
                  {badge.progressLabel}
                </p>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
