import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import RoadmapModuleList, {
  type RoadmapModule,
} from "@/components/roadmap-module-list";

vi.mock("@/components/progress-provider", () => ({
  useProgress: () => ({
    isLessonCompleted: () => false,
    isReady: true,
  }),
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

describe("RoadmapModuleList", () => {
  it("renders modules and lesson links", () => {
    const modules: RoadmapModule[] = [
      {
        id: "module-1",
        key: "foundations",
        title: "Foundations",
        description: "Start here.",
        order: 1,
        lessons: [
          {
            id: "lesson-1",
            slug: "intro",
            title: "Intro to the roadmap",
            order: 1,
            estimatedMinutes: 20,
          },
        ],
      },
    ];

    render(<RoadmapModuleList modules={modules} />);

    expect(
      screen.getByRole("heading", { name: /foundations/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /intro to the roadmap/i })
    ).toHaveAttribute("href", "/lesson/intro");
    expect(screen.getByText(/20 min/i)).toBeInTheDocument();
  });

  it("renders a fallback when no modules are available", () => {
    render(<RoadmapModuleList modules={[]} />);
    expect(
      screen.getByText(/modules will appear here/i)
    ).toBeInTheDocument();
  });
});
