import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LessonNextCoreCta from "@/components/lesson-next-core-cta";
import type { RoadmapModule } from "@/components/roadmap-module-list";

const focusMocks = vi.hoisted(() => ({
  focusKey: null as string | null,
}));

const progressMocks = vi.hoisted(() => ({
  completedLessonSlugs: [] as string[],
  isReady: true,
  setLessonCompletion: vi.fn(),
}));

vi.mock("@/components/focus-provider", () => ({
  useFocus: () => ({
    focusKey: focusMocks.focusKey,
  }),
}));

vi.mock("@/components/progress-provider", () => ({
  useProgress: () => ({
    completedLessonSlugs: progressMocks.completedLessonSlugs,
    isReady: progressMocks.isReady,
    setLessonCompletion: progressMocks.setLessonCompletion,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("LessonNextCoreCta", () => {
  beforeEach(() => {
    focusMocks.focusKey = null;
    progressMocks.completedLessonSlugs = [];
    progressMocks.isReady = true;
    progressMocks.setLessonCompletion.mockReset();
  });

  it("links to the next core lesson after the current lesson", () => {
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
            slug: "start-to-finish-roadmap",
            title: "Start here",
            order: 1,
            estimatedMinutes: null,
          },
          {
            id: "lesson-2",
            slug: "tech-recruiting-timeline",
            title: "Timeline",
            order: 2,
            estimatedMinutes: null,
          },
        ],
      },
      {
        id: "module-2",
        key: "explore-roles",
        title: "Explore roles",
        description: null,
        order: 2,
        lessons: [
          {
            id: "lesson-3",
            slug: "explore-technology-jobs",
            title: "Explore tech",
            order: 1,
            estimatedMinutes: null,
          },
        ],
      },
    ];

    render(<LessonNextCoreCta modules={modules} currentLessonSlug="start-to-finish-roadmap" />);

    const link = screen.getByRole("link", { name: /next core lesson/i });
    expect(link).toHaveAttribute("href", "/lesson/tech-recruiting-timeline");
  });

  it("marks the current lesson complete when the CTA is used", async () => {
    const user = userEvent.setup();
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
            slug: "start-to-finish-roadmap",
            title: "Start here",
            order: 1,
            estimatedMinutes: null,
          },
          {
            id: "lesson-2",
            slug: "tech-recruiting-timeline",
            title: "Timeline",
            order: 2,
            estimatedMinutes: null,
          },
        ],
      },
    ];

    render(<LessonNextCoreCta modules={modules} currentLessonSlug="start-to-finish-roadmap" />);

    await user.click(screen.getByRole("link", { name: /next core lesson/i }));

    expect(progressMocks.setLessonCompletion).toHaveBeenCalledWith(
      "start-to-finish-roadmap",
      true,
      "navigator"
    );
  });

  it("falls back to the next incomplete core lesson when the current lesson is extra credit", () => {
    progressMocks.completedLessonSlugs = ["start-to-finish-roadmap"];

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
            slug: "start-to-finish-roadmap",
            title: "Start here",
            order: 1,
            estimatedMinutes: null,
          },
          {
            id: "lesson-2",
            slug: "tech-recruiting-timeline",
            title: "Timeline",
            order: 2,
            estimatedMinutes: null,
          },
        ],
      },
      {
        id: "module-2",
        key: "internship-success",
        title: "Internship Success",
        description: null,
        order: 2,
        lessons: [
          {
            id: "lesson-3",
            slug: "internship-success-handbook",
            title: "Handbook",
            order: 1,
            estimatedMinutes: null,
          },
        ],
      },
    ];

    render(<LessonNextCoreCta modules={modules} currentLessonSlug="internship-success-handbook" />);

    const link = screen.getByRole("link", { name: /next core lesson/i });
    expect(link).toHaveAttribute("href", "/lesson/tech-recruiting-timeline");
  });
});
