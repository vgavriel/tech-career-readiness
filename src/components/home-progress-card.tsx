"use client";

import { useMemo } from "react";

import { useFocus } from "@/components/focus-provider";
import type { RoadmapModule } from "@/components/roadmap-module-list";
import RoadmapProgressSummary from "@/components/roadmap-progress-summary";
import { orderModulesForFocus } from "@/lib/focus-order";

type HomeProgressCardProps = {
  modules: RoadmapModule[];
};

export default function HomeProgressCard({ modules }: HomeProgressCardProps) {
  const { focusKey } = useFocus();
  const focusModules = useMemo(
    () => (focusKey ? orderModulesForFocus(modules, focusKey) : null),
    [focusKey, modules]
  );

  return (
    <RoadmapProgressSummary
      modules={modules}
      focusKey={focusKey}
      focusModules={focusModules}
      showExtraCredit={false}
      showNextLesson={false}
      showSignIn={false}
    />
  );
}
