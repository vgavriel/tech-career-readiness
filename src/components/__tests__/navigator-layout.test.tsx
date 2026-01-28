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

  it("expands from a collapsed state with ArrowRight", async () => {
    render(
      <NavigatorLayout navigator={<div>Navigator</div>}>
        <div>Lesson content</div>
      </NavigatorLayout>
    );

    const toggle = screen.getByRole("button", { name: /collapse navigator/i });
    fireEvent.pointerDown(toggle);
    fireEvent.click(toggle);

    const separator = screen.getByRole("separator");
    await waitFor(() => {
      expect(separator).toHaveAttribute("aria-valuenow", "0");
    });

    fireEvent.keyDown(separator, { key: "ArrowRight" });

    await waitFor(() => {
      expect(separator).toHaveAttribute("aria-valuenow", "20");
      expect(separator).toHaveAttribute("aria-valuetext", "Navigator width 20%");
    });
  });

  it("resizes with pointer drag and updates cursor state", async () => {
    const { container } = render(
      <NavigatorLayout navigator={<div>Navigator</div>}>
        <div>Lesson content</div>
      </NavigatorLayout>
    );

    const root = container.firstElementChild as HTMLElement;
    Object.defineProperty(root, "getBoundingClientRect", {
      value: () => ({
        left: 0,
        width: 1000,
        top: 0,
        height: 600,
        right: 1000,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });

    const separator = screen.getByRole("separator");
    expect(separator).toHaveClass("cursor-ew-resize");

    fireEvent.pointerDown(separator, { clientX: 260 });

    await waitFor(() => {
      expect(separator).toHaveClass("cursor-col-resize");
    });

    fireEvent.pointerMove(window, { clientX: 300 });
    fireEvent.pointerUp(window);

    await waitFor(() => {
      expect(separator).toHaveAttribute("aria-valuenow", "30");
    });

    await waitFor(() => {
      expect(separator).toHaveClass("cursor-ew-resize");
    });
  });

  it("auto-collapses when the media query matches", async () => {
    mockMatchMedia(true);

    render(
      <NavigatorLayout navigator={<div>Navigator</div>}>
        <div>Lesson content</div>
      </NavigatorLayout>
    );

    await waitFor(() => {
      expect(screen.queryByRole("separator")).toBeNull();
    });

    const navigator = screen.getByLabelText("Lesson navigator");
    expect(navigator).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByRole("button", { name: /open navigator/i })
    ).toBeInTheDocument();
  });

  it("scrolls to hash targets when clicking in-page links", () => {
    const scrollToMock = vi.fn();
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollToMock,
    });

    try {
      render(
        <NavigatorLayout navigator={<div>Navigator</div>}>
          <div>
            <a href="#target">Jump to target</a>
            <div id="target">Target section</div>
          </div>
        </NavigatorLayout>
      );

      const main = screen.getByRole("main");
      const target = screen.getByText("Target section");

      Object.defineProperty(main, "scrollTop", {
        value: 0,
        writable: true,
      });
      Object.defineProperty(main, "getBoundingClientRect", {
        value: () => ({
          top: 0,
          bottom: 600,
          left: 0,
          right: 600,
          width: 600,
          height: 600,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      });
      Object.defineProperty(target, "getBoundingClientRect", {
        value: () => ({
          top: 300,
          bottom: 340,
          left: 0,
          right: 600,
          width: 600,
          height: 40,
          x: 0,
          y: 300,
          toJSON: () => ({}),
        }),
      });

      fireEvent.click(screen.getByRole("link", { name: /jump to target/i }));

      expect(scrollToMock).toHaveBeenCalledWith(
        expect.objectContaining({ top: 300, behavior: "auto" })
      );
    } finally {
      if (originalScrollTo) {
        Object.defineProperty(HTMLElement.prototype, "scrollTo", {
          configurable: true,
          value: originalScrollTo,
        });
      } else {
        delete (HTMLElement.prototype as { scrollTo?: unknown }).scrollTo;
      }
    }
  });
});
