import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import RoadmapFocusStatus from "@/components/roadmap-focus-status";

const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

const selectionMocks = vi.hoisted(() => ({
  clearFocusSelection: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMocks,
}));

vi.mock("@/lib/focus-selection", () => ({
  clearFocusSelection: () => selectionMocks.clearFocusSelection(),
}));

vi.mock("@/components/roadmap-focus-provider", () => ({
  useRoadmapFocus: () => ({
    focusKey: "applying-soon",
    focusModules: [
      {
        id: "module-1",
        key: "start-here",
        title: "Start Here",
        description: null,
        order: 1,
        lessons: [],
      },
    ],
  }),
}));

describe("RoadmapFocusStatus", () => {
  it("renders focus status and clears focus", async () => {
    const user = userEvent.setup();

    render(<RoadmapFocusStatus totalModules={9} />);

    expect(screen.getByText(/focus active/i)).toBeInTheDocument();
    expect(screen.getByText(/showing 1 of 9 modules/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear focus/i }));

    expect(selectionMocks.clearFocusSelection).toHaveBeenCalled();
    expect(routerMocks.replace).toHaveBeenCalledWith("/roadmap");
    expect(routerMocks.refresh).toHaveBeenCalled();
  });
});
