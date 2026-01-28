"use client";

import { useRoadmapFocus } from "@/components/roadmap-focus-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import RoadmapProgressSummary from "@/components/roadmap-progress-summary";

/**
 * Props for the focus-aware progress summary.
 */
type RoadmapFocusSummaryProps = {
  modules: RoadmapModule[];
};

/**
 * Render the progress summary scoped to the active focus selection.
 */
export default function RoadmapFocusSummary({ modules }: RoadmapFocusSummaryProps) {
  const { focusKey, focusModules } = useRoadmapFocus();

  return (
    <RoadmapProgressSummary modules={modules} focusKey={focusKey} focusModules={focusModules} />
  );
}
