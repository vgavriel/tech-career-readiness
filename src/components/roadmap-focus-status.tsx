"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { useRoadmapFocus } from "@/components/roadmap-focus-provider";
import { FOCUS_OPTIONS } from "@/lib/focus-options";
import { clearFocusSelection } from "@/lib/focus-selection";

type RoadmapFocusStatusProps = {
  totalModules: number;
};

export default function RoadmapFocusStatus({
  totalModules,
}: RoadmapFocusStatusProps) {
  const router = useRouter();
  const { focusKey, focusModules } = useRoadmapFocus();
  const focusOption = useMemo(
    () => FOCUS_OPTIONS.find((option) => option.key === focusKey) ?? null,
    [focusKey]
  );

  if (!focusKey || !focusOption || !focusModules?.length) {
    return null;
  }

  const handleClear = () => {
    clearFocusSelection();
    router.replace("/roadmap");
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-4 text-sm shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
            Focus active
          </p>
          <p className="font-display text-lg text-[color:var(--ink-900)]">
            {focusOption.label}
          </p>
          <p className="text-xs text-[color:var(--ink-600)]">
            {focusOption.description}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-800)] transition hover:border-[color:var(--ink-800)]"
        >
          Clear focus
        </button>
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
        Showing {focusModules.length} of {totalModules} modules
      </p>
    </div>
  );
}
