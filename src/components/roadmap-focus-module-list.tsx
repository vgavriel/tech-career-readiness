"use client";

import RoadmapModuleList, {
  type RoadmapModule,
} from "@/components/roadmap-module-list";
import { useRoadmapFocus } from "@/components/roadmap-focus-provider";

type RoadmapFocusModuleListProps = {
  modules: RoadmapModule[];
};

export default function RoadmapFocusModuleList({
  modules,
}: RoadmapFocusModuleListProps) {
  const { focusModules } = useRoadmapFocus();

  return <RoadmapModuleList modules={focusModules ?? modules} />;
}
