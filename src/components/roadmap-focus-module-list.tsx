"use client";

import { useRoadmapFocus } from "@/components/roadmap-focus-provider";
import RoadmapModuleList, { type RoadmapModule } from "@/components/roadmap-module-list";

/**
 * Props for the focus-aware roadmap list.
 */
type RoadmapFocusModuleListProps = {
  modules: RoadmapModule[];
};

/**
 * Render the roadmap module list scoped to the active focus selection.
 */
export default function RoadmapFocusModuleList({ modules }: RoadmapFocusModuleListProps) {
  const { focusKey, focusModules } = useRoadmapFocus();

  return <RoadmapModuleList modules={focusModules ?? modules} focusKey={focusKey} />;
}
