import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LessonNavigator from "@/components/lesson-navigator";
import type { RoadmapModule } from "@/components/roadmap-module-list";

const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
}));

const focusMocks = vi.hoisted(() => ({
  setFocusKey: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

vi.mock("@/components/focus-provider", () => ({
  useFocus: () => ({
    focusKey: null,
    setFocusKey: focusMocks.setFocusKey,
  }),
}));

vi.mock("@/components/progress-provider", () => ({
  useProgress: () => ({
    isLessonCompleted: () => false,
    isReady: true,
    isAuthenticated: true,
    isMerging: false,
    setLessonCompletion: vi.fn(),
  }),
}));

vi.mock("@/components/sign-in-cta", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

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

describe("LessonNavigator", () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it("scrolls the navigator panel to the active lesson when it is out of view", async () => {
    const modules: RoadmapModule[] = [
      {
        id: "module-1",
        key: "start-here",
        title: "Start here",
        description: null,
        order: 1,
        lessons: [
          {
            id: "lesson-1",
            slug: "lesson-one",
            title: "Lesson One",
            order: 1,
            estimatedMinutes: null,
          },
          {
            id: "lesson-2",
            slug: "lesson-two",
            title: "Lesson Two",
            order: 2,
            estimatedMinutes: null,
          },
        ],
      },
    ];

    const { container, rerender } = render(
      <LessonNavigator
        modules={modules}
        currentLessonSlug="lesson-one"
        currentModuleKey="start-here"
      />
    );

    const scrollPanel = container.querySelector(".scroll-panel") as HTMLDivElement;
    const target = container.querySelector(
      "#navigator-lesson-lesson-two"
    ) as HTMLElement;

    expect(scrollPanel).not.toBeNull();
    expect(target).not.toBeNull();

    const scrollToMock = vi.fn();
    Object.defineProperty(scrollPanel, "scrollTo", {
      value: scrollToMock,
    });
    Object.defineProperty(scrollPanel, "scrollTop", {
      value: 0,
      writable: true,
    });

    const panelRect = {
      top: 0,
      bottom: 200,
      left: 0,
      right: 300,
      width: 300,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect;
    const targetRect = {
      top: 300,
      bottom: 340,
      left: 0,
      right: 300,
      width: 300,
      height: 40,
      x: 0,
      y: 300,
      toJSON: () => ({}),
    } as DOMRect;

    Object.defineProperty(scrollPanel, "getBoundingClientRect", {
      value: () => panelRect,
    });
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => targetRect,
    });

    rerender(
      <LessonNavigator
        modules={modules}
        currentLessonSlug="lesson-two"
        currentModuleKey="start-here"
      />
    );

    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalledWith(
        expect.objectContaining({ top: 220, behavior: "smooth" })
      );
    });
  });
});
