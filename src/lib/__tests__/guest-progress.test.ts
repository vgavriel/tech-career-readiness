import { beforeEach, describe, expect, it } from "vitest";

import {
  clearGuestProgress,
  GUEST_PROGRESS_STORAGE_KEY,
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

    expect(updated.completed["lesson-1"]).toBe("completed");
    expect(hasGuestProgress(updated)).toBe(true);

    const afterClear = updateGuestProgress("lesson-1", false);
    expect(afterClear.completed["lesson-1"]).toBeUndefined();
    expect(hasGuestProgress(afterClear)).toBe(false);

    updateGuestProgress("lesson-2", true);
    clearGuestProgress();

    expect(readGuestProgress()).toEqual({ version: 1, completed: {} });
  });

  it("falls back to memory when localStorage throws", () => {
    const originalStorage = window.localStorage;
    const failingStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    } as Storage;

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: failingStorage,
    });

    try {
      const updated = updateGuestProgress("lesson-1", true);
      expect(updated.completed["lesson-1"]).toBe("completed");
      expect(readGuestProgress().completed["lesson-1"]).toBe("completed");

      clearGuestProgress();
      expect(readGuestProgress()).toEqual({ version: 1, completed: {} });
    } finally {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: originalStorage,
      });
    }
  });

  it("resets invalid stored progress and ignores blank updates", () => {
    localStorage.setItem(
      GUEST_PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 0, completed: { "lesson-1": "completed" } })
    );

    expect(readGuestProgress()).toEqual({ version: 1, completed: {} });

    const updated = updateGuestProgress("   ", true);
    expect(updated.completed).toEqual({});
  });

  it("keeps in-memory progress when storage is unavailable", () => {
    const originalStorage = window.localStorage;

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      },
    });

    try {
      const updated = updateGuestProgress("lesson-1", true);
      expect(updated.completed["lesson-1"]).toBe("completed");

      clearGuestProgress();
      expect(readGuestProgress()).toEqual({ version: 1, completed: {} });
    } finally {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: originalStorage,
      });
    }
  });
});
