"use client";

import { useMemo } from "react";

import type { RoadmapModule } from "@/components/roadmap-module-list";
import { useProgress } from "@/components/progress-provider";
import { buildBadgeStatuses } from "@/lib/badges";

type RoadmapBadgeAwardsProps = {
  modules: RoadmapModule[];
};

export default function RoadmapBadgeAwards({ modules }: RoadmapBadgeAwardsProps) {
  const { completedLessonKeys } = useProgress();
  const badges = useMemo(
    () => buildBadgeStatuses(modules, completedLessonKeys),
    [modules, completedLessonKeys]
  );
  const earnedCount = badges.filter((badge) => badge.isEarned).length;

  return (
    <section className="rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-6 shadow-[var(--shadow-card)] md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
            Badge awards
          </p>
          <h2 className="mt-2 font-display text-2xl text-[color:var(--ink-900)]">
            Earn momentum markers
          </h2>
        </div>
        <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-900)]">
          {earnedCount} of {badges.length} earned
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {badges.map((badge, index) => (
          <div
            key={badge.key}
            className="flex flex-col gap-3 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-4 py-3 shadow-[var(--shadow-soft)] animate-fade"
            style={{ animationDelay: `${index * 70}ms` }}
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
                className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] ${
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
    </section>
  );
}
