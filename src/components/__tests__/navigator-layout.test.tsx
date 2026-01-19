import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import NavigatorLayout from "@/components/navigator-layout";

const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
};

describe("NavigatorLayout", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("adjusts the separator value with keyboard input", async () => {
    render(
      <NavigatorLayout navigator={<div>Navigator</div>}>
        <div>Lesson content</div>
      </NavigatorLayout>
    );

    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-valuenow", "26");

    fireEvent.keyDown(separator, { key: "ArrowRight" });

    await waitFor(() => {
      expect(separator).toHaveAttribute("aria-valuenow", "28");
    });
  });

  it("collapses the navigator from the minimum width via keyboard", async () => {
    render(
      <NavigatorLayout navigator={<div>Navigator</div>}>
        <div>Lesson content</div>
      </NavigatorLayout>
    );

    const separator = screen.getByRole("separator");

    fireEvent.keyDown(separator, { key: "Home" });
    fireEvent.keyDown(separator, { key: "ArrowLeft" });

    await waitFor(() => {
      expect(separator).toHaveAttribute("aria-valuenow", "0");
      expect(separator).toHaveAttribute("aria-valuetext", "Navigator collapsed");
    });
  });
});
