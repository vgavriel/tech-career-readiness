import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import RoleLibraryList, {
  type RoleLibraryLesson,
} from "@/components/role-library-list";

const progressMocks = vi.hoisted(() => ({
  isLessonCompleted: vi.fn(),
  isReady: true,
}));

vi.mock("@/components/progress-provider", () => ({
  useProgress: () => ({
    isLessonCompleted: progressMocks.isLessonCompleted,
    isReady: progressMocks.isReady,
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

describe("RoleLibraryList", () => {
  beforeEach(() => {
    progressMocks.isLessonCompleted.mockReset();
    progressMocks.isLessonCompleted.mockImplementation(
      (slug: string) => slug === "learn-about-ai-engineering"
    );
    progressMocks.isReady = true;
  });

  it("renders role deep dive lessons with completion states", () => {
    const lessons: RoleLibraryLesson[] = [
      {
        id: "lesson-1",
        slug: "learn-about-ai-engineering",
        title: "Learn about AI Engineering",
      },
      {
        id: "lesson-2",
        slug: "learn-about-backend-engineering",
        title: "Learn about Backend Engineering",
      },
    ];

    render(<RoleLibraryList lessons={lessons} />);

    expect(
      screen.getByRole("link", { name: /learn about ai engineering/i })
    ).toHaveAttribute("href", "/lesson/learn-about-ai-engineering");
    expect(
      screen.getByRole("link", { name: /learn about backend engineering/i })
    ).toHaveAttribute("href", "/lesson/learn-about-backend-engineering");
    expect(screen.getByText(/^completed$/i)).toBeInTheDocument();
    expect(screen.getByText(/extra credit/i)).toBeInTheDocument();
  });

  it("shows loading states before progress is ready", () => {
    progressMocks.isReady = false;

    const lessons: RoleLibraryLesson[] = [
      {
        id: "lesson-1",
        slug: "learn-about-ai-engineering",
        title: "Learn about AI Engineering",
      },
    ];

    render(<RoleLibraryList lessons={lessons} />);

    expect(screen.getByText(/loading progress/i)).toBeInTheDocument();
    expect(screen.queryByText(/^completed$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/extra credit/i)).not.toBeInTheDocument();
  });

  it("renders a fallback when no lessons are available", () => {
    render(<RoleLibraryList lessons={[]} />);
    expect(
      screen.getByText(/role deep dives will appear here/i)
    ).toBeInTheDocument();
  });
});
