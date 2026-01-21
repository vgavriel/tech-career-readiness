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
  const earnedBadges = sortedBadges.filter((badge) => badge.isEarned);
  const inProgressBadges = sortedBadges.filter((badge) => !badge.isEarned);

  return (
    <section className="rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
            Momentum markers
          </h2>
        </div>
        <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-700)]">
          {earnedCount} of {badges.length} earned
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--ink-800)]">
              Earned
            </p>
            <span className="text-xs text-[color:var(--ink-500)]">
              {earnedBadges.length}
            </span>
          </div>
          {earnedBadges.length ? (
            <div className="grid gap-3">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.key}
                  className="flex flex-col gap-3 rounded-2xl border border-[color:var(--accent-700)] bg-[color:var(--wash-0)] px-4 py-3 shadow-[var(--shadow-soft)]"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[color:var(--ink-500)]">
                      {badge.title}
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                      {badge.description}
                    </p>
                  </div>
                  <p className="text-xs text-[color:var(--ink-500)]">
                    {badge.progressLabel}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4 text-sm text-[color:var(--ink-600)]">
              Complete your first module to earn a badge.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--ink-800)]">
              In progress
            </p>
            <span className="text-xs text-[color:var(--ink-500)]">
              {inProgressBadges.length}
            </span>
          </div>
          <div className="grid gap-3">
            {inProgressBadges.map((badge) => (
              <div
                key={badge.key}
                className="flex flex-col gap-2 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-4 py-3 shadow-[var(--shadow-soft)]"
              >
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-[color:var(--ink-500)]">
                    {badge.title}
                  </p>
                  <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                    {badge.description}
                  </p>
                </div>
                <p className="text-xs text-[color:var(--ink-500)]">
                  {badge.progressLabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
