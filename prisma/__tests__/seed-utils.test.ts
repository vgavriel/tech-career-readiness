import { describe, expect, it } from "vitest";

import seedUtils from "../seed-utils";

const { resolveExistingRecord, getLessonKey, collectLessonKeys } = seedUtils;

describe("seed utils", () => {
  it("prefers key matches even when an order match exists", () => {
    const keyRecord = { id: "key" };
    const orderRecord = { id: "order" };

    const result = resolveExistingRecord({
      recordByKey: keyRecord,
      recordByOrder: orderRecord,
    });

    expect(result.record).toBe(keyRecord);
    expect(result.reason).toBe("key");
  });

  it("falls back to order when key matches are missing", () => {
    const orderRecord = { id: "order" };

    const result = resolveExistingRecord({
      recordByKey: null,
      recordByOrder: orderRecord,
    });

    expect(result.record).toBe(orderRecord);
    expect(result.reason).toBe("order");
  });

  it("returns null when no match is found", () => {
    const result = resolveExistingRecord({
      recordByKey: null,
      recordByOrder: null,
    });

    expect(result.record).toBeNull();
    expect(result.reason).toBe("create");
  });

  it("derives lesson keys from explicit keys first", () => {
    expect(getLessonKey({ key: "lesson-key", slug: "lesson-slug" })).toBe(
      "lesson-key"
    );
  });

  it("derives lesson keys from slugs when keys are missing", () => {
    expect(getLessonKey({ slug: "lesson-slug" })).toBe("lesson-slug");
  });

  it("collects lesson keys in order", () => {
    const keys = collectLessonKeys([
      { key: "lesson-a", slug: "lesson-a" },
      { slug: "lesson-b" },
    ]);

    expect(keys).toEqual(["lesson-a", "lesson-b"]);
  });
});
