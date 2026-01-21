import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

const progressMocks = vi.hoisted(() => ({
  useProgress: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    module: {
      findMany: prismaMocks.findMany,
    },
  },
}));

vi.mock("@/components/progress-provider", () => ({
  useProgress: () => progressMocks.useProgress(),
}));

vi.mock("@/components/focus-provider", () => ({
  useFocus: () => ({
    focusKey: null,
    isReady: true,
    isUpdating: false,
    setFocusKey: vi.fn(),
  }),
}));

const modules = [
  {
    id: "module-start",
    key: "start-here",
    title: "Start here",
    description: null,
    order: 1,
    lessons: [
      {
        id: "lesson-start",
        slug: "start-here",
        title: "Start here lesson",
        order: 1,
        estimatedMinutes: 5,
      },
      {
        id: "lesson-next",
        slug: "next-steps",
        title: "Next steps",
        order: 2,
        estimatedMinutes: 6,
      },
    ],
  },
];

describe("Home page", () => {
  beforeEach(() => {
    prismaMocks.findMany.mockReset();
    progressMocks.useProgress.mockReset();
    prismaMocks.findMany.mockResolvedValue(modules);
    progressMocks.useProgress.mockReturnValue({
      completedLessonSlugs: [],
      isAuthenticated: false,
      isMerging: false,
      isReady: true,
      isLessonCompleted: () => false,
      setLessonCompletion: vi.fn(),
      refreshProgress: vi.fn(),
    });
  });

  it("renders the hero and primary CTA for new visitors", async () => {
    const Home = (await import("@/app/page")).default;
    const ui = await Home();
    render(ui);

    expect(
      screen.getByRole("heading", {
        name: /step-by-step prep for tech recruiting at brown/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /start course/i })).toHaveAttribute(
      "href",
      "/lesson/start-here"
    );
  });

  it("shows a continue CTA when progress exists", async () => {
    progressMocks.useProgress.mockReturnValue({
      completedLessonSlugs: ["start-here"],
      isAuthenticated: false,
      isMerging: false,
      isReady: true,
      isLessonCompleted: () => true,
      setLessonCompletion: vi.fn(),
      refreshProgress: vi.fn(),
    });

    const Home = (await import("@/app/page")).default;
    const ui = await Home();
    render(ui);

    expect(screen.getByRole("link", { name: /continue course/i })).toHaveAttribute(
      "href",
      "/lesson/next-steps"
    );
  });
});
