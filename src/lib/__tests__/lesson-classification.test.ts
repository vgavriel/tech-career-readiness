import { describe, expect, it } from "vitest";

import {
  getLessonClassification,
  isExtraCreditLesson,
  isRoleDeepDiveLesson,
} from "@/lib/lesson-classification";

describe("lesson classification", () => {
  it("identifies core lessons", () => {
    const classification = getLessonClassification({
      slug: "start-to-finish-roadmap",
    });

    expect(classification.credit).toBe("core");
    expect(classification.roleDeepDive).toBe(false);
    expect(classification.isMapped).toBe(true);
  });

  it("identifies extra credit role deep dives", () => {
    const classification = getLessonClassification({
      slug: "learn-about-ai-engineering",
    });

    expect(classification.credit).toBe("extra");
    expect(classification.roleDeepDive).toBe(true);
    expect(classification.isMapped).toBe(true);
    expect(isExtraCreditLesson({ slug: "learn-about-ai-engineering" })).toBe(
      true
    );
    expect(isRoleDeepDiveLesson({ slug: "learn-about-ai-engineering" })).toBe(
      true
    );
  });

  it("identifies extra credit non-role lessons", () => {
    const classification = getLessonClassification({
      slug: "tech-career-stories",
    });

    expect(classification.credit).toBe("extra");
    expect(classification.roleDeepDive).toBe(false);
    expect(isRoleDeepDiveLesson({ slug: "tech-career-stories" })).toBe(false);
  });

  it("falls back to core when a lesson is missing", () => {
    const classification = getLessonClassification({ slug: "unknown-lesson" });

    expect(classification.credit).toBe("core");
    expect(classification.roleDeepDive).toBe(false);
    expect(classification.isMapped).toBe(false);
  });
});
