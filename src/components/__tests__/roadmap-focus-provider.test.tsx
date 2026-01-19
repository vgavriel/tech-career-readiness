import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoadmapFocusModuleList from "@/components/roadmap-focus-module-list";
import {
  RoadmapFocusProvider,
  useRoadmapFocus,
} from "@/components/roadmap-focus-provider";
import RoadmapFocusSummary from "@/components/roadmap-focus-summary";
import type { RoadmapModule } from "@/components/roadmap-module-list";

const selectionMocks = vi.hoisted(() => ({
  readFocusSelection: vi.fn(),
  writeFocusSelection: vi.fn(),
  subscribeToFocusSelection: vi.fn(),
}));

const progressMocks = vi.hoisted(() => ({
  useProgress: vi.fn(),
}));

vi.mock("@/lib/focus-selection", () => ({
  readFocusSelection: () => selectionMocks.readFocusSelection(),
  writeFocusSelection: (focusKey: string | null) =>
    selectionMocks.writeFocusSelection(focusKey),
  subscribeToFocusSelection: (listener: () => void) =>
    selectionMocks.subscribeToFocusSelection(listener),
}));

vi.mock("@/components/progress-provider", () => ({
  useProgress: () => progressMocks.useProgress(),
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

const modules: RoadmapModule[] = [
  {
    id: "module-start",
    key: "start-here",
    title: "Start here",
    description: null,
    order: 1,
    lessons: [
      {
        id: "lesson-start",
        slug: "start-here",
        title: "Start here lesson",
        order: 1,
        estimatedMinutes: null,
      },
    ],
  },
  {
    id: "module-interviews",
    key: "interviews",
    title: "Interviews",
    description: null,
    order: 6,
    lessons: [
      {
        id: "lesson-interviews",
        slug: "interviews",
        title: "Interview prep",
        order: 1,
        estimatedMinutes: null,
      },
    ],
  },
  {
    id: "module-offers",
    key: "offers",
    title: "Offers",
    description: null,
    order: 7,
    lessons: [
      {
        id: "lesson-offers",
        slug: "offer",
        title: "Offer review",
        order: 1,
        estimatedMinutes: null,
      },
    ],
  },
  {
    id: "module-internship",
    key: "internship-success",
    title: "Internship success",
    description: null,
    order: 8,
    lessons: [
      {
        id: "lesson-internship",
        slug: "internship",
        title: "Internship prep",
        order: 1,
        estimatedMinutes: null,
      },
    ],
  },
];

describe("RoadmapFocusProvider", () => {
  beforeEach(() => {
    selectionMocks.readFocusSelection.mockReset();
    selectionMocks.writeFocusSelection.mockReset();
    selectionMocks.subscribeToFocusSelection.mockReset();
    selectionMocks.subscribeToFocusSelection.mockImplementation(() => () => {});
    progressMocks.useProgress.mockReset();
    progressMocks.useProgress.mockReturnValue({
      completedLessonSlugs: [],
      isAuthenticated: true,
      isMerging: false,
      isReady: true,
      isLessonCompleted: () => false,
    });
  });

  it("uses stored focus selection to drive the continue CTA", async () => {
    selectionMocks.readFocusSelection.mockReturnValue({
      version: 1,
      focusKey: "offer-in-hand",
    });

    render(
      <RoadmapFocusProvider modules={modules}>
        <RoadmapFocusSummary modules={modules} />
      </RoadmapFocusProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /continue where you left off/i })
      ).toHaveAttribute("href", "/lesson/offer");
    });
  });

  it("prefers the provided focus key over stored selection", async () => {
    selectionMocks.readFocusSelection.mockReturnValue({
      version: 1,
      focusKey: "offer-in-hand",
    });

    render(
      <RoadmapFocusProvider modules={modules} focusKey="interviewing-soon">
        <RoadmapFocusModuleList modules={modules} />
      </RoadmapFocusProvider>
    );

    await waitFor(() => {
      expect(selectionMocks.writeFocusSelection).toHaveBeenCalledWith(
        "interviewing-soon"
      );
    });

    expect(
      screen.getByRole("heading", { name: /start here/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /interviews/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /offers/i })
    ).not.toBeInTheDocument();
  });

  it("returns null focus modules when no selection is active", () => {
    selectionMocks.readFocusSelection.mockReturnValue({
      version: 1,
      focusKey: null,
    });

    const FocusConsumer = () => {
      const { focusKey, focusModules } = useRoadmapFocus();
      return (
        <div data-testid="focus-state">
          {focusKey ?? "none"}-{focusModules ? focusModules.length : 0}
        </div>
      );
    };

    render(
      <RoadmapFocusProvider modules={modules}>
        <FocusConsumer />
      </RoadmapFocusProvider>
    );

    expect(screen.getByTestId("focus-state")).toHaveTextContent("none-0");
  });

  it("throws when useRoadmapFocus is used outside the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const BrokenConsumer = () => {
      useRoadmapFocus();
      return null;
    };

    expect(() => render(<BrokenConsumer />)).toThrow(
      "useRoadmapFocus must be used within RoadmapFocusProvider."
    );

    consoleError.mockRestore();
  });
});
