import { describe, expect, it } from "vitest";

import {
  getModuleProgressSnapshot,
  isCurrentModuleVisibleForFocus,
  summarizeVisibleLessonProgress,
} from "@/lib/lesson-navigator";
import type { RoadmapModule } from "@/lib/roadmap-types";

const modules: RoadmapModule[] = [
  {
    id: "module-1",
    key: "start-here",
    title: "Start here",
    description: null,
    order: 1,
    lessons: [
      {
        id: "lesson-1",
        slug: "start-to-finish-roadmap",
        title: "Start",
        order: 1,
        estimatedMinutes: null,
      },
      {
        id: "lesson-2",
        slug: "tech-career-stories",
        title: "Stories",
        order: 2,
        estimatedMinutes: null,
      },
    ],
  },
  {
    id: "module-2",
    key: "offers",
    title: "Offers",
    description: null,
    order: 2,
    lessons: [
      {
        id: "lesson-3",
        slug: "evaluating-offers",
        title: "Offers",
        order: 1,
        estimatedMinutes: null,
      },
    ],
  },
];

describe("lesson navigator helpers", () => {
  it("treats module as visible when no focus is active", () => {
    expect(
      isCurrentModuleVisibleForFocus({
        focusKey: null,
        currentModuleKey: "start-here",
        visibleModules: [modules[1]],
      })
    ).toBe(true);
  });

  it("detects when the current module is filtered out by focus", () => {
    expect(
      isCurrentModuleVisibleForFocus({
        focusKey: "offer-in-hand",
        currentModuleKey: "start-here",
        visibleModules: [modules[1]],
      })
    ).toBe(false);
  });

  it("builds module progress snapshot with core and extra separation", () => {
    const snapshot = getModuleProgressSnapshot({
      module: modules[0],
      currentLessonSlug: "tech-career-stories",
      isReady: true,
      isLessonCompleted: (slug) => slug === "start-to-finish-roadmap",
    });

    expect(snapshot.coreLessons).toHaveLength(1);
    expect(snapshot.extraLessons).toHaveLength(1);
    expect(snapshot.isModuleComplete).toBe(true);
    expect(snapshot.extraCompletedCount).toBe(0);
    expect(snapshot.progressLabel).toBe("1/1 core");
    expect(snapshot.isActiveExtra).toBe(true);
  });

  it("summarizes visible lesson completion counts", () => {
    const summary = summarizeVisibleLessonProgress({
      modules,
      isReady: true,
      isLessonCompleted: (slug) =>
        slug === "start-to-finish-roadmap" || slug === "evaluating-offers",
    });

    expect(summary).toEqual({
      coreCompleted: 2,
      coreTotal: 2,
      extraCompleted: 0,
      extraTotal: 1,
    });
  });
});
