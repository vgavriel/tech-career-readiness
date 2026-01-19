import { describe, expect, it } from "vitest";

import seedUtils from "../seed-utils";

const { resolveExistingRecord, getLessonSlug, collectLessonSlugs } = seedUtils;

describe("seed utils", () => {
  it("prefers slug matches even when an order match exists", () => {
    const slugRecord = { id: "slug" };
    const orderRecord = { id: "order" };

    const result = resolveExistingRecord({
      recordBySlug: slugRecord,
      recordByOrder: orderRecord,
    });

    expect(result.record).toBe(slugRecord);
    expect(result.reason).toBe("slug");
  });

  it("falls back to order when slug matches are missing", () => {
    const orderRecord = { id: "order" };

    const result = resolveExistingRecord({
      recordBySlug: null,
      recordByOrder: orderRecord,
    });

    expect(result.record).toBe(orderRecord);
    expect(result.reason).toBe("order");
  });

  it("returns null when no match is found", () => {
    const result = resolveExistingRecord({
      recordBySlug: null,
      recordByOrder: null,
    });

    expect(result.record).toBeNull();
    expect(result.reason).toBe("create");
  });

  it("derives lesson slugs from the payload", () => {
    expect(getLessonSlug({ slug: "lesson-slug" })).toBe("lesson-slug");
  });

  it("collects lesson slugs in order", () => {
    const slugs = collectLessonSlugs([
      { slug: "lesson-a" },
      { slug: "lesson-b" },
    ]);

    expect(slugs).toEqual(["lesson-a", "lesson-b"]);
  });
});
