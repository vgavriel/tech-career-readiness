"use client";

import { useRoadmapFocus } from "@/components/roadmap-focus-provider";
import RoadmapModuleList, { type RoadmapModule } from "@/components/roadmap-module-list";

type RoadmapFocusModuleListProps = {
  modules: RoadmapModule[];
};

export default function RoadmapFocusModuleList({ modules }: RoadmapFocusModuleListProps) {
  const { focusKey, focusModules } = useRoadmapFocus();

  return <RoadmapModuleList modules={focusModules ?? modules} focusKey={focusKey} />;
}
