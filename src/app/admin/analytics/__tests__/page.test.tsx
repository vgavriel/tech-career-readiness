import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
}));

const prismaMocks = vi.hoisted(() => ({
  lessonCount: vi.fn(),
  userFindMany: vi.fn(),
}));

const navMocks = vi.hoisted(() => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/auth-user", () => ({
  getAuthenticatedUser: authMocks.getAuthenticatedUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lesson: {
      count: prismaMocks.lessonCount,
    },
    user: {
      findMany: prismaMocks.userFindMany,
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: [string]) => navMocks.redirect(...args),
  notFound: () => navMocks.notFound(),
}));

describe("Admin analytics page", () => {
  beforeEach(() => {
    authMocks.getAuthenticatedUser.mockReset();
    prismaMocks.lessonCount.mockReset();
    prismaMocks.userFindMany.mockReset();
    navMocks.redirect.mockReset();
    navMocks.notFound.mockReset();
  });

  it("redirects unauthenticated users to sign-in", async () => {
    authMocks.getAuthenticatedUser.mockResolvedValue(null);
    navMocks.redirect.mockImplementation(() => {
      throw new Error("REDIRECT");
    });

    const AdminAnalyticsPage = (await import("@/app/admin/analytics/page")).default;

    await expect(AdminAnalyticsPage()).rejects.toThrow("REDIRECT");
    expect(navMocks.redirect).toHaveBeenCalledWith("/api/auth/signin/google");
    expect(prismaMocks.lessonCount).not.toHaveBeenCalled();
  });

  it("returns not-found for non-admin users", async () => {
    authMocks.getAuthenticatedUser.mockResolvedValue({
      id: "user-1",
      email: "student@example.com",
      name: "Student",
      image: null,
      isAdmin: false,
      focusKey: null,
    });
    navMocks.notFound.mockImplementation(() => {
      throw new Error("NOT_FOUND");
    });

    const AdminAnalyticsPage = (await import("@/app/admin/analytics/page")).default;

    await expect(AdminAnalyticsPage()).rejects.toThrow("NOT_FOUND");
    expect(navMocks.notFound).toHaveBeenCalled();
    expect(prismaMocks.lessonCount).not.toHaveBeenCalled();
  });

  it("renders analytics for admin users", async () => {
    authMocks.getAuthenticatedUser.mockResolvedValue({
      id: "user-2",
      email: "admin@example.com",
      name: "Admin",
      image: null,
      isAdmin: true,
      focusKey: null,
    });
    prismaMocks.lessonCount.mockResolvedValue(12);
    prismaMocks.userFindMany.mockResolvedValue([
      {
        id: "user-3",
        email: "learner@example.com",
        name: "Learner",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        progress: [],
        events: [],
      },
    ]);

    const AdminAnalyticsPage = (await import("@/app/admin/analytics/page")).default;
    const ui = await AdminAnalyticsPage();
    render(ui);

    expect(
      screen.getByRole("heading", {
        name: /usage, progress, and timelines/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/total users/i)).toBeInTheDocument();
    expect(screen.getByText(/total lessons/i)).toBeInTheDocument();
  });
});
