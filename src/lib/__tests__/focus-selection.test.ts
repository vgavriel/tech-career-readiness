import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  FOCUS_SELECTION_STORAGE_KEY,
  clearFocusSelection,
  hasFocusSelection,
  readFocusSelection,
  subscribeToFocusSelection,
  writeFocusSelection,
} from "@/lib/focus-selection";

describe("focus selection storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty selection when storage is blank", () => {
    expect(readFocusSelection()).toEqual({ version: 1, focusKey: null });
  });

  it("stores and clears the focus selection", () => {
    writeFocusSelection("just-starting");

    const stored = readFocusSelection();
    expect(stored.focusKey).toBe("just-starting");
    expect(hasFocusSelection(stored)).toBe(true);

    clearFocusSelection();

    expect(readFocusSelection()).toEqual({ version: 1, focusKey: null });
  });

  it("normalizes unknown focus keys to null", () => {
    localStorage.setItem(
      FOCUS_SELECTION_STORAGE_KEY,
      JSON.stringify({ version: 1, focusKey: "not-a-focus" })
    );

    expect(readFocusSelection().focusKey).toBeNull();
  });

  it("resets selection when the stored version is invalid", () => {
    localStorage.setItem(
      FOCUS_SELECTION_STORAGE_KEY,
      JSON.stringify({ version: 0, focusKey: "offer-in-hand" })
    );

    expect(readFocusSelection()).toEqual({ version: 1, focusKey: null });
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
      writeFocusSelection("applying-soon");
      expect(readFocusSelection().focusKey).toBe("applying-soon");

      clearFocusSelection();
      expect(readFocusSelection()).toEqual({ version: 1, focusKey: null });
    } finally {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: originalStorage,
      });
    }
  });

  it("handles storage access failures gracefully", () => {
    const originalStorage = window.localStorage;

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("blocked");
      },
    });

    try {
      writeFocusSelection("offer-in-hand");
      expect(readFocusSelection().focusKey).toBe("offer-in-hand");

      clearFocusSelection();
      expect(readFocusSelection()).toEqual({ version: 1, focusKey: null });
    } finally {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        value: originalStorage,
      });
    }
  });

  it("subscribes to focus selection changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToFocusSelection(listener);

    window.dispatchEvent(
      new StorageEvent("storage", { key: "other-key" })
    );
    expect(listener).not.toHaveBeenCalled();

    window.dispatchEvent(
      new StorageEvent("storage", { key: FOCUS_SELECTION_STORAGE_KEY })
    );
    window.dispatchEvent(new Event("tcr-focus-selection-change"));

    expect(listener).toHaveBeenCalledTimes(2);

    listener.mockClear();
    unsubscribe();

    window.dispatchEvent(
      new StorageEvent("storage", { key: FOCUS_SELECTION_STORAGE_KEY })
    );
    window.dispatchEvent(new Event("tcr-focus-selection-change"));

    expect(listener).not.toHaveBeenCalled();
  });
});
