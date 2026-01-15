import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: authMocks.getServerSession,
}));

describe("Home page", () => {
  it("renders the hero and primary CTAs for signed-out visitors", async () => {
    authMocks.getServerSession.mockResolvedValue(null);

    const Home = (await import("@/app/page")).default;
    const ui = await Home();
    render(ui);

    expect(
      screen.getByRole("heading", {
        name: /land your first tech role with a calm, structured plan/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /view the roadmap/i })).toHaveAttribute(
      "href",
      "/roadmap"
    );

    expect(
      screen.getByRole("button", { name: /sign in to save progress/i })
    ).toBeInTheDocument();
  });

  it("hides the sign-in CTA for signed-in visitors", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: { name: "Ada Lovelace", email: "ada@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    });

    const Home = (await import("@/app/page")).default;
    const ui = await Home();
    render(ui);

    expect(
      screen.queryByRole("button", { name: /sign in to save progress/i })
    ).not.toBeInTheDocument();
  });
});
