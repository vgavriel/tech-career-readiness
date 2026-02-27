import { describe, expect, it } from "vitest";

import { buildLessonNextCoreCtaDecision } from "@/lib/lesson-next-core-cta";
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
        slug: "tech-recruiting-timeline",
        title: "Timeline",
        order: 2,
        estimatedMinutes: null,
      },
      {
        id: "lesson-3",
        slug: "practice-interviews",
        title: "Practice",
        order: 3,
        estimatedMinutes: null,
      },
    ],
  },
];

describe("buildLessonNextCoreCtaDecision", () => {
  it("returns next lesson when current core lesson is not the last one", () => {
    const decision = buildLessonNextCoreCtaDecision({
      modules,
      focusKey: null,
      currentLessonSlug: "start-to-finish-roadmap",
      completedLessonSlugs: [],
      isReady: true,
    });

    expect(decision.ctaState).toMatchObject({
      kind: "lesson",
      variant: "next",
      lesson: { slug: "tech-recruiting-timeline" },
    });
  });

  it("returns catch-up lesson when on last core lesson with earlier incompletes", () => {
    const decision = buildLessonNextCoreCtaDecision({
      modules,
      focusKey: null,
      currentLessonSlug: "practice-interviews",
      completedLessonSlugs: ["tech-recruiting-timeline"],
      isReady: true,
    });

    expect(decision.ctaState).toMatchObject({
      kind: "lesson",
      variant: "catch-up",
      lesson: { slug: "start-to-finish-roadmap" },
    });
  });

  it("returns complete state when all core lessons are complete", () => {
    const decision = buildLessonNextCoreCtaDecision({
      modules,
      focusKey: null,
      currentLessonSlug: "practice-interviews",
      completedLessonSlugs: ["start-to-finish-roadmap", "tech-recruiting-timeline"],
      isReady: true,
    });

    expect(decision.ctaState).toEqual({ kind: "complete" });
    expect(decision.restartLesson?.slug).toBe("start-to-finish-roadmap");
  });

  it("returns hidden state when there are no core lessons", () => {
    const decision = buildLessonNextCoreCtaDecision({
      modules: [
        {
          id: "module-extra",
          key: "internship-success",
          title: "Internship",
          description: null,
          order: 1,
          lessons: [
            {
              id: "lesson-extra",
              slug: "tech-career-stories",
              title: "Stories",
              order: 1,
              estimatedMinutes: null,
            },
          ],
        },
      ],
      focusKey: null,
      currentLessonSlug: "tech-career-stories",
      completedLessonSlugs: [],
      isReady: true,
    });

    expect(decision).toEqual({
      ctaState: { kind: "hidden" },
      restartLesson: null,
    });
  });
});
