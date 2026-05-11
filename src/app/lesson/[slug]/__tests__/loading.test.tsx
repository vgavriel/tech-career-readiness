import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import LessonLoading from "@/app/lesson/[slug]/loading";

vi.mock("@/components/navigator-layout", () => ({
  default: ({ navigator, children }: { navigator: ReactNode; children: ReactNode }) => (
    <div>
      <aside>{navigator}</aside>
      <main>{children}</main>
    </div>
  ),
}));

describe("Lesson loading state", () => {
  it("renders a visible status while lesson content loads", () => {
    render(<LessonLoading />);

    expect(screen.getByTestId("lesson-loading")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading lesson content...");
  });
});
