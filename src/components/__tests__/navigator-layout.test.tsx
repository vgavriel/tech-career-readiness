import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Link from "next/link";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  pathname: "/lesson/current",
  searchParams: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useSearchParams: () => new URLSearchParams(navigationMocks.searchParams),
}));

import NavigatorLayout, {
  LESSON_NAVIGATION_FAILSAFE_MS,
  LESSON_NAVIGATION_INDICATOR_DELAY_MS,
} from "@/components/navigator-layout";

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
    navigationMocks.pathname = "/lesson/current";
    navigationMocks.searchParams = "";
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

  it("keeps the desktop navigator toggle above the lesson panel", () => {
    render(
      <NavigatorLayout navigator={<div>Navigator</div>}>
        <div>Lesson content</div>
      </NavigatorLayout>
    );

    expect(screen.getByRole("separator")).toHaveClass("z-40");
    expect(screen.getByRole("button", { name: /collapse navigator/i })).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: /open navigator/i })).toBeInTheDocument();
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

  it("shows a delayed main-panel loading overlay after navigator lesson clicks", () => {
    vi.useFakeTimers();

    const lessonFrame = (
      <NavigatorLayout navigator={<Link href="/lesson/next">Next lesson</Link>}>
        <h1>Current lesson</h1>
        <div>Current lesson content</div>
      </NavigatorLayout>
    );

    try {
      const { rerender } = render(lessonFrame);
      screen
        .getByRole("link", { name: /next lesson/i })
        .addEventListener("click", (event) => event.preventDefault());

      fireEvent.click(screen.getByRole("link", { name: /next lesson/i }));

      expect(screen.getByRole("heading", { name: /current lesson/i })).toBeInTheDocument();
      expect(screen.getByText(/current lesson content/i)).toBeInTheDocument();
      expect(screen.queryByTestId("lesson-navigation-loading")).not.toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false");

      act(() => {
        vi.advanceTimersByTime(LESSON_NAVIGATION_INDICATOR_DELAY_MS);
      });

      expect(screen.getByTestId("lesson-navigation-loading")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Loading lesson...");
      expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");

      navigationMocks.pathname = "/lesson/next";
      rerender(
        <NavigatorLayout navigator={<Link href="/lesson/next">Next lesson</Link>}>
          <h1>Next lesson</h1>
          <div>Next lesson content</div>
        </NavigatorLayout>
      );

      expect(screen.queryByTestId("lesson-navigation-loading")).not.toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false");
      expect(screen.getByText(/next lesson content/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not flash the navigation overlay when cached content settles before the delay", () => {
    vi.useFakeTimers();

    try {
      const { rerender } = render(
        <NavigatorLayout navigator={<Link href="/lesson/next">Next lesson</Link>}>
          <h1>Current lesson</h1>
          <div>Current lesson content</div>
        </NavigatorLayout>
      );
      screen
        .getByRole("link", { name: /next lesson/i })
        .addEventListener("click", (event) => event.preventDefault());

      fireEvent.click(screen.getByRole("link", { name: /next lesson/i }));

      navigationMocks.pathname = "/lesson/next";
      rerender(
        <NavigatorLayout navigator={<Link href="/lesson/next">Next lesson</Link>}>
          <h1>Next lesson</h1>
          <div>Next lesson content</div>
        </NavigatorLayout>
      );

      act(() => {
        vi.advanceTimersByTime(LESSON_NAVIGATION_INDICATOR_DELAY_MS + 1);
      });

      expect(screen.getByText(/next lesson content/i)).toBeInTheDocument();
      expect(screen.queryByTestId("lesson-navigation-loading")).not.toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the navigation overlay when a lesson redirect settles on another route", () => {
    vi.useFakeTimers();

    try {
      const { rerender } = render(
        <NavigatorLayout navigator={<Link href="/lesson/legacy">Legacy lesson</Link>}>
          <h1>Current lesson</h1>
          <div>Current lesson content</div>
        </NavigatorLayout>
      );
      screen
        .getByRole("link", { name: /legacy lesson/i })
        .addEventListener("click", (event) => event.preventDefault());

      fireEvent.click(screen.getByRole("link", { name: /legacy lesson/i }));

      act(() => {
        vi.advanceTimersByTime(LESSON_NAVIGATION_INDICATOR_DELAY_MS);
      });

      expect(screen.getByTestId("lesson-navigation-loading")).toBeInTheDocument();

      navigationMocks.pathname = "/lesson/canonical";
      rerender(
        <NavigatorLayout navigator={<Link href="/lesson/legacy">Legacy lesson</Link>}>
          <h1>Canonical lesson</h1>
          <div>Canonical lesson content</div>
        </NavigatorLayout>
      );

      expect(screen.getByText(/canonical lesson content/i)).toBeInTheDocument();
      expect(screen.queryByTestId("lesson-navigation-loading")).not.toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the navigation overlay when rendered lesson content changes before pathname updates", () => {
    vi.useFakeTimers();

    try {
      const { rerender } = render(
        <NavigatorLayout
          renderedLessonRouteKey="/lesson/current"
          navigator={<Link href="/lesson/next">Next lesson</Link>}
        >
          <h1>Current lesson</h1>
          <div>Current lesson content</div>
        </NavigatorLayout>
      );
      screen
        .getByRole("link", { name: /next lesson/i })
        .addEventListener("click", (event) => event.preventDefault());

      fireEvent.click(screen.getByRole("link", { name: /next lesson/i }));

      act(() => {
        vi.advanceTimersByTime(LESSON_NAVIGATION_INDICATOR_DELAY_MS);
      });

      expect(screen.getByTestId("lesson-navigation-loading")).toBeInTheDocument();

      rerender(
        <NavigatorLayout
          renderedLessonRouteKey="/lesson/next"
          navigator={<Link href="/lesson/next">Next lesson</Link>}
        >
          <h1>Next lesson</h1>
          <div>Next lesson content</div>
        </NavigatorLayout>
      );

      expect(screen.getByText(/next lesson content/i)).toBeInTheDocument();
      expect(screen.queryByTestId("lesson-navigation-loading")).not.toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears the navigation overlay if a lesson navigation never commits", () => {
    vi.useFakeTimers();

    try {
      render(
        <NavigatorLayout navigator={<Link href="/lesson/next">Next lesson</Link>}>
          <h1>Current lesson</h1>
          <div>Current lesson content</div>
        </NavigatorLayout>
      );
      screen
        .getByRole("link", { name: /next lesson/i })
        .addEventListener("click", (event) => event.preventDefault());

      fireEvent.click(screen.getByRole("link", { name: /next lesson/i }));

      act(() => {
        vi.advanceTimersByTime(LESSON_NAVIGATION_INDICATOR_DELAY_MS);
      });

      expect(screen.getByTestId("lesson-navigation-loading")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(LESSON_NAVIGATION_FAILSAFE_MS);
      });

      expect(screen.queryByTestId("lesson-navigation-loading")).not.toBeInTheDocument();
      expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not show the navigation overlay for the current lesson link", () => {
    render(
      <NavigatorLayout navigator={<Link href="/lesson/current">Current lesson</Link>}>
        <h1>Current lesson</h1>
      </NavigatorLayout>
    );

    const currentLink = screen.getByRole("link", { name: /current lesson/i });
    currentLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(currentLink);

    expect(screen.queryByTestId("lesson-navigation-loading")).not.toBeInTheDocument();
  });
});
