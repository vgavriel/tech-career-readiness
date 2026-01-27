import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SiteHeader from "@/components/site-header";

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(),
  getProviders: vi.fn(),
}));
const navMocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => authMocks.signIn(...args),
  signOut: (...args: unknown[]) => authMocks.signOut(...args),
  useSession: (...args: unknown[]) => authMocks.useSession(...args),
  getProviders: (...args: unknown[]) => authMocks.getProviders(...args),
}));

vi.mock("@/components/focus-menu", () => ({
  default: () => <div>Focus menu</div>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navMocks.usePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SiteHeader", () => {
  beforeEach(() => {
    authMocks.signIn.mockReset();
    authMocks.signOut.mockReset();
    authMocks.useSession.mockReset();
    authMocks.getProviders.mockReset();
    navMocks.usePathname.mockReset();
    authMocks.getProviders.mockResolvedValue({
      google: { id: "google", name: "Google" },
    });
    navMocks.usePathname.mockReturnValue("/");
  });

  it("renders sign-in when unauthenticated", async () => {
    authMocks.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<SiteHeader />);
    await waitFor(() => expect(authMocks.getProviders).toHaveBeenCalled());

    const signInButton = screen.getByRole("button", {
      name: /sign in with google/i,
    });
    expect(signInButton).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(signInButton);

    expect(authMocks.signIn).toHaveBeenCalledWith("google", undefined);
    expect(authMocks.signOut).not.toHaveBeenCalled();
  });

  it("renders user info and sign-out when authenticated", async () => {
    authMocks.useSession.mockReturnValue({
      data: {
        user: { name: "Ada Lovelace", email: "ada@example.com" },
        expires: "2099-01-01T00:00:00.000Z",
      },
      status: "authenticated",
    });

    render(<SiteHeader />);
    await waitFor(() => expect(authMocks.getProviders).toHaveBeenCalled());

    expect(
      screen.getByText(/signed in as: ada lovelace/i)
    ).toBeInTheDocument();

    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    const user = userEvent.setup();
    await user.click(signOutButton);

    expect(authMocks.signOut).toHaveBeenCalled();
  });

  it("shows focus menu and closes the mobile menu on escape", async () => {
    authMocks.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    navMocks.usePathname.mockReturnValue("/lesson/start-to-finish-roadmap");

    render(<SiteHeader />);
    await waitFor(() => expect(authMocks.getProviders).toHaveBeenCalled());

    expect(screen.getAllByText("Focus menu").length).toBeGreaterThan(0);

    const menuButton = screen.getByRole("button", { name: /menu/i });
    const user = userEvent.setup();
    await user.click(menuButton);
    expect(document.querySelector("#mobile-menu-panel")).toBeInTheDocument();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await waitFor(() =>
      expect(document.querySelector("#mobile-menu-panel")).not.toBeInTheDocument()
    );
  });
});
