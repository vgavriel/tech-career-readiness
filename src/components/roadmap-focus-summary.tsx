"use client";

import RoadmapProgressSummary from "@/components/roadmap-progress-summary";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import { useRoadmapFocus } from "@/components/roadmap-focus-provider";

type RoadmapFocusSummaryProps = {
  modules: RoadmapModule[];
};

export default function RoadmapFocusSummary({
  modules,
}: RoadmapFocusSummaryProps) {
  const { focusKey, focusModules } = useRoadmapFocus();

  return (
    <RoadmapProgressSummary
      modules={modules}
      focusKey={focusKey}
      focusModules={focusModules}
    />
  );
}
