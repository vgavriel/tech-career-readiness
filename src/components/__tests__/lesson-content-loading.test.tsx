import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LessonContentLoading from "@/components/lesson-content-loading";

describe("LessonContentLoading", () => {
  it("renders a visible status while lesson content loads", () => {
    render(<LessonContentLoading />);

    expect(screen.getByTestId("lesson-content-loading")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Loading lesson content...");
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
  });
});
