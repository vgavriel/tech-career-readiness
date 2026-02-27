import { describe, expect, it } from "vitest";

import {
  buildProgressSummaryCta,
  buildProgressSummaryFromLessons,
  type ProgressSummaryLesson,
} from "@/lib/progress-summary";

const lessons: ProgressSummaryLesson[] = [
  {
    id: "lesson-1",
    slug: "start-to-finish-roadmap",
    title: "Start",
    order: 1,
    moduleOrder: 1,
  },
  {
    id: "lesson-2",
    slug: "tech-recruiting-timeline",
    title: "Timeline",
    order: 2,
    moduleOrder: 1,
  },
];

describe("buildProgressSummaryCta", () => {
  it("returns continue CTA when there is remaining work in active summary", () => {
    const coreSummary = buildProgressSummaryFromLessons(
      lessons,
      new Set(["start-to-finish-roadmap"]),
      true
    );
    const activeSummary = coreSummary;

    const cta = buildProgressSummaryCta({ coreSummary, activeSummary });

    expect(cta.coreComplete).toBe(false);
    expect(cta.ctaLabel).toBe("Continue course");
    expect(cta.ctaLesson?.slug).toBe("tech-recruiting-timeline");
  });

  it("returns review CTA when active summary is complete but core is not", () => {
    const coreSummary = buildProgressSummaryFromLessons(
      lessons,
      new Set(["start-to-finish-roadmap"]),
      true
    );
    const activeSummary = buildProgressSummaryFromLessons(
      [lessons[0]],
      new Set(["start-to-finish-roadmap"]),
      true
    );

    const cta = buildProgressSummaryCta({ coreSummary, activeSummary });

    expect(cta.coreComplete).toBe(false);
    expect(cta.ctaLabel).toBe("Review course");
    expect(cta.ctaLesson?.slug).toBe("start-to-finish-roadmap");
  });

  it("returns celebratory restart CTA when core summary is complete", () => {
    const coreSummary = buildProgressSummaryFromLessons(
      lessons,
      new Set(["start-to-finish-roadmap", "tech-recruiting-timeline"]),
      true
    );
    const activeSummary = coreSummary;

    const cta = buildProgressSummaryCta({ coreSummary, activeSummary });

    expect(cta.coreComplete).toBe(true);
    expect(cta.ctaLabel).toMatch(/end of the core course/i);
    expect(cta.ctaLesson?.slug).toBe("start-to-finish-roadmap");
  });
});
