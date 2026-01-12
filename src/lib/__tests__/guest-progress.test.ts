import { beforeEach, describe, expect, it } from "vitest";

import {
  clearGuestProgress,
  hasGuestProgress,
  readGuestProgress,
  updateGuestProgress,
} from "@/lib/guest-progress";

describe("guest progress storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty progress when storage is blank", () => {
    expect(readGuestProgress()).toEqual({ version: 1, completed: {} });
  });

  it("updates and clears lesson completion", () => {
    const updated = updateGuestProgress("lesson-1", true);

    expect(updated.completed["lesson-1"]).toBeDefined();
    expect(hasGuestProgress(updated)).toBe(true);

    const afterClear = updateGuestProgress("lesson-1", false);
    expect(afterClear.completed["lesson-1"]).toBeUndefined();
    expect(hasGuestProgress(afterClear)).toBe(false);

    updateGuestProgress("lesson-2", true);
    clearGuestProgress();

    expect(readGuestProgress()).toEqual({ version: 1, completed: {} });
  });
});
