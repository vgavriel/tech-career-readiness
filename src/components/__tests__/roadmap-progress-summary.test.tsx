import { render, screen, within } from "@testing-library/react";
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
    key: "foundations",
    title: "Foundations",
    description: null,
    order: 1,
    lessons: [
      {
        id: "lesson-1",
        key: "lesson-1",
        slug: "intro",
        title: "Intro",
        order: 1,
        estimatedMinutes: null,
      },
      {
        id: "lesson-2",
        key: "lesson-2",
        slug: "next",
        title: "Next steps",
        order: 2,
        estimatedMinutes: null,
      },
    ],
  },
];

const modulesWithExtraCredit: RoadmapModule[] = [
  {
    id: "module-0",
    key: "start-here",
    title: "Start here",
    description: null,
    order: 1,
    lessons: [
      {
        id: "lesson-core",
        key: "start-to-finish-roadmap",
        slug: "start-to-finish-roadmap",
        title: "Start to Finish",
        order: 1,
        estimatedMinutes: null,
      },
      {
        id: "lesson-extra",
        key: "tech-career-stories",
        slug: "tech-career-stories",
        title: "Tech Career Stories",
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
      completedLessonKeys: ["lesson-1"],
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
      screen.getByRole("button", { name: /sign in to save progress/i })
    ).toBeInTheDocument();
  });

  it("shows a review action when all lessons are complete", () => {
    progressMocks.useProgress.mockReturnValue({
      completedLessonKeys: ["lesson-1", "lesson-2"],
      isAuthenticated: true,
      isMerging: false,
      isReady: true,
    });

    render(<RoadmapProgressSummary modules={modules} />);

    expect(
      screen.getByRole("link", { name: /review from the start/i })
    ).toHaveAttribute("href", "/lesson/intro");
    expect(
      screen.queryByRole("button", { name: /sign in to save progress/i })
    ).not.toBeInTheDocument();
  });

  it("shows focus progress when a focus is selected", () => {
    progressMocks.useProgress.mockReturnValue({
      completedLessonKeys: ["lesson-1"],
      isAuthenticated: true,
      isMerging: false,
      isReady: true,
    });

    render(
      <RoadmapProgressSummary
        modules={modules}
        focusModules={modules}
        focusKey="applying-soon"
      />
    );

    const focusSection = screen.getByText(/focus: applying soon/i).parentElement;
    expect(focusSection).not.toBeNull();
    if (!focusSection) {
      return;
    }

    expect(
      within(focusSection).getByText(/1 of 2 complete/i)
    ).toBeInTheDocument();
  });

  it("shows extra credit progress separately from core progress", () => {
    progressMocks.useProgress.mockReturnValue({
      completedLessonKeys: ["tech-career-stories"],
      isAuthenticated: false,
      isMerging: false,
      isReady: true,
    });

    render(<RoadmapProgressSummary modules={modulesWithExtraCredit} />);

    expect(screen.getByText(/0 of 1 complete/i)).toBeInTheDocument();

    const extraCreditSection = screen.getByText(/extra credit/i).parentElement;
    expect(extraCreditSection).not.toBeNull();
    if (!extraCreditSection) {
      return;
    }

    expect(
      within(extraCreditSection).getByText(/1 of 1 complete/i)
    ).toBeInTheDocument();
    expect(within(extraCreditSection).getByText(/100%/i)).toBeInTheDocument();
  });
});
