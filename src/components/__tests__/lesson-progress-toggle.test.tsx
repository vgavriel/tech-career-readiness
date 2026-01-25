import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LessonProgressToggle from "@/components/lesson-progress-toggle";

const progressMocks = vi.hoisted(() => ({
  isLessonCompleted: vi.fn(),
  isReady: true,
  isMerging: false,
  progressError: null as { message: string; source: string } | null,
  clearProgressError: vi.fn(),
  setLessonCompletion: vi.fn(),
}));

vi.mock("@/components/progress-provider", () => ({
  useProgress: () => ({
    isLessonCompleted: progressMocks.isLessonCompleted,
    isReady: progressMocks.isReady,
    isMerging: progressMocks.isMerging,
    progressError: progressMocks.progressError,
    clearProgressError: progressMocks.clearProgressError,
    setLessonCompletion: progressMocks.setLessonCompletion,
  }),
}));

describe("LessonProgressToggle", () => {
  beforeEach(() => {
    progressMocks.isLessonCompleted.mockReset();
    progressMocks.isLessonCompleted.mockReturnValue(false);
    progressMocks.isReady = true;
    progressMocks.isMerging = false;
    progressMocks.progressError = null;
    progressMocks.clearProgressError.mockReset();
    progressMocks.setLessonCompletion.mockReset();
  });

  it("triggers a progress update for the lesson", async () => {
    const user = userEvent.setup();
    render(<LessonProgressToggle lessonSlug="lesson-1" />);

    await user.click(screen.getByRole("button", { name: /mark complete/i }));

    expect(progressMocks.setLessonCompletion).toHaveBeenCalledWith(
      "lesson-1",
      true,
      "toggle"
    );
  });

  it("renders and clears the error message when progress fails", async () => {
    const user = userEvent.setup();
    progressMocks.progressError = {
      message: "We couldn't save your progress. Please try again.",
      source: "toggle",
    };

    render(<LessonProgressToggle lessonSlug="lesson-1" />);

    expect(
      screen.getByText(/couldn't save your progress/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(progressMocks.clearProgressError).toHaveBeenCalled();
  });
});
