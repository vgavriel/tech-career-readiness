import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LessonNotFoundCta from "@/components/lesson-not-found-cta";
import type { ProgressSummaryModule } from "@/lib/progress-summary";

const focusMocks = vi.hoisted(() => ({
  focusKey: null as string | null,
}));

const progressMocks = vi.hoisted(() => ({
  completedLessonSlugs: [] as string[],
  isReady: true,
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
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const modules: ProgressSummaryModule[] = [
  {
    id: "module-1",
    key: "start-here",
    order: 1,
    lessons: [
      {
        id: "lesson-1",
        slug: "start-to-finish-roadmap",
        title: "Start here",
        order: 1,
      },
      {
        id: "lesson-2",
        slug: "tech-recruiting-timeline",
        title: "Timeline",
        order: 2,
      },
    ],
  },
];

describe("LessonNotFoundCta", () => {
  beforeEach(() => {
    focusMocks.focusKey = null;
    progressMocks.completedLessonSlugs = [];
    progressMocks.isReady = true;
  });

  it("links to the first lesson when the core course is complete", () => {
    progressMocks.completedLessonSlugs = ["start-to-finish-roadmap", "tech-recruiting-timeline"];

    render(<LessonNotFoundCta modules={modules} />);

    const link = screen.getByRole("link", { name: /end of the core course/i });
    expect(link).toHaveAttribute("href", "/lesson/start-to-finish-roadmap");
  });
});
