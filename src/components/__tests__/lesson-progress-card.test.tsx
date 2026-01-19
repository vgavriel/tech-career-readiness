import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LessonProgressCard from "@/components/lesson-progress-card";

const progressMocks = vi.hoisted(() => ({
  useProgress: vi.fn(),
}));

vi.mock("@/components/progress-provider", () => ({
  useProgress: () => progressMocks.useProgress(),
}));

describe("LessonProgressCard", () => {
  beforeEach(() => {
    progressMocks.useProgress.mockReset();
  });

  it("renders a complete action when incomplete", async () => {
    const setLessonCompletion = vi.fn();

    progressMocks.useProgress.mockReturnValue({
      isLessonCompleted: () => false,
      isAuthenticated: false,
      isMerging: false,
      isReady: true,
      setLessonCompletion,
    });

    render(<LessonProgressCard lessonSlug="lesson-1" lessonTitle="Resume basics" />);

    expect(
      screen.getByRole("button", { name: /mark complete/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in to save progress/i })
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /mark complete/i }));
    expect(setLessonCompletion).toHaveBeenCalledWith("lesson-1", true);
  });

  it("renders an incomplete action when completed", async () => {
    const setLessonCompletion = vi.fn();

    progressMocks.useProgress.mockReturnValue({
      isLessonCompleted: () => true,
      isAuthenticated: true,
      isMerging: false,
      isReady: true,
      setLessonCompletion,
    });

    render(<LessonProgressCard lessonSlug="lesson-2" lessonTitle="Interview prep" />);

    expect(
      screen.getByRole("button", { name: /mark incomplete/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /sign in to save progress/i })
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /mark incomplete/i })
    );
    expect(setLessonCompletion).toHaveBeenCalledWith("lesson-2", false);
  });
});
