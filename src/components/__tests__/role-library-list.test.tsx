import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import RoleLibraryList, {
  type RoleLibraryLesson,
} from "@/components/role-library-list";

vi.mock("@/components/progress-provider", () => ({
  useProgress: () => ({
    isLessonCompleted: (slug: string) => slug === "learn-about-ai-engineering",
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

describe("RoleLibraryList", () => {
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

  it("renders a fallback when no lessons are available", () => {
    render(<RoleLibraryList lessons={[]} />);
    expect(
      screen.getByText(/role deep dives will appear here/i)
    ).toBeInTheDocument();
  });
});
