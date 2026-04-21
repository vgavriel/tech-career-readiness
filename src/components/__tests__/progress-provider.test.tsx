import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProgressProvider, useProgress } from "@/components/progress-provider";
import { clearGuestProgress, writeGuestProgress } from "@/lib/guest-progress";

const sessionMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: (...args: unknown[]) => sessionMocks.useSession(...args),
}));

const buildResponse = (body: unknown, ok = true) =>
  ({
    ok,
    json: async () => body,
  }) as Response;

const ProgressInspector = () => {
  const { completedLessonSlugs, isAuthenticated, isLessonCompleted, isReady } = useProgress();

  return (
    <div>
      <div data-testid="ready">{isReady ? "yes" : "no"}</div>
      <div data-testid="authenticated">{isAuthenticated ? "yes" : "no"}</div>
      <div data-testid="completed">
        {completedLessonSlugs.length > 0 ? completedLessonSlugs.join(",") : "none"}
      </div>
      <div data-testid="lesson-1">{isLessonCompleted("lesson-1") ? "yes" : "no"}</div>
      <div data-testid="lesson-2">{isLessonCompleted("lesson-2") ? "yes" : "no"}</div>
    </div>
  );
};

describe("ProgressProvider", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    sessionMocks.useSession.mockReset();
    fetchMock.mockReset();
    clearGuestProgress();
    window.localStorage.clear();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    clearGuestProgress();
    vi.unstubAllGlobals();
  });

  it("loads guest progress when unauthenticated", async () => {
    writeGuestProgress({
      version: 1,
      completed: {
        "lesson-1": "completed",
      },
    });
    sessionMocks.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(
      <ProgressProvider>
        <ProgressInspector />
      </ProgressProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("yes");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("no");
    expect(screen.getByTestId("completed")).toHaveTextContent("lesson-1");
    expect(screen.getByTestId("lesson-1")).toHaveTextContent("yes");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads authenticated progress from the API", async () => {
    sessionMocks.useSession.mockReturnValue({
      data: {
        expires: "2099-01-01T00:00:00.000Z",
        user: { email: "ada@example.com" },
      },
      status: "authenticated",
    });
    fetchMock.mockResolvedValue(buildResponse({ completedLessonSlugs: ["lesson-2"] }));

    render(
      <ProgressProvider>
        <ProgressInspector />
      </ProgressProvider>
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/progress",
        expect.objectContaining({ method: "GET" })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("ready")).toHaveTextContent("yes");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("yes");
    expect(screen.getByTestId("completed")).toHaveTextContent("lesson-2");
    expect(screen.getByTestId("lesson-2")).toHaveTextContent("yes");
  });
});
