import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LessonContent from "@/components/lesson-content";

describe("LessonContent", () => {
  it("renders sanitized HTML content", () => {
    render(
      <LessonContent
        html="<h2>Lesson Title</h2><p>Read the lesson content.</p>"
      />
    );

    expect(
      screen.getByRole("heading", { name: /lesson title/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/read the lesson content/i)).toBeInTheDocument();
    expect(screen.getByTestId("lesson-content")).toBeInTheDocument();
  });
});
