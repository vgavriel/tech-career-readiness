import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoadmapProgressSummary from "@/components/roadmap-progress-summary";
import type { RoadmapModule } from "@/components/roadmap-module-list";

const progressMocks = vi.hoisted(() => ({
  useProgress: vi.fn(),
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
    id: "module-1",
    title: "Foundations",
    description: null,
    order: 1,
    lessons: [
      {
        id: "lesson-1",
        slug: "intro",
        title: "Intro",
        order: 1,
        estimatedMinutes: null,
      },
      {
        id: "lesson-2",
        slug: "next",
        title: "Next steps",
        order: 2,
        estimatedMinutes: null,
      },
    ],
  },
];

describe("RoadmapProgressSummary", () => {
  beforeEach(() => {
    progressMocks.useProgress.mockReset();
  });

  it("shows progress and a continue link", () => {
    progressMocks.useProgress.mockReturnValue({
      completedLessonIds: ["lesson-1"],
      isAuthenticated: false,
      isMerging: false,
      isReady: true,
    });

    render(<RoadmapProgressSummary modules={modules} />);

    expect(screen.getByText(/50%/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /continue where you left off/i })
    ).toHaveAttribute("href", "/lesson/next");
    expect(
      screen.getByRole("link", { name: /sign in to save progress/i })
    ).toBeInTheDocument();
  });

  it("shows a review action when all lessons are complete", () => {
    progressMocks.useProgress.mockReturnValue({
      completedLessonIds: ["lesson-1", "lesson-2"],
      isAuthenticated: true,
      isMerging: false,
      isReady: true,
    });

    render(<RoadmapProgressSummary modules={modules} />);

    expect(
      screen.getByRole("link", { name: /review from the start/i })
    ).toHaveAttribute("href", "/lesson/intro");
    expect(
      screen.queryByRole("link", { name: /sign in to save progress/i })
    ).not.toBeInTheDocument();
  });
});
