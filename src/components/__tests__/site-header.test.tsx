import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SiteHeader from "@/components/site-header";

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => authMocks.signIn(...args),
  signOut: (...args: unknown[]) => authMocks.signOut(...args),
  useSession: (...args: unknown[]) => authMocks.useSession(...args),
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
  });

  it("renders sign-in when unauthenticated", async () => {
    authMocks.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    render(<SiteHeader />);

    const signInButton = screen.getByRole("button", {
      name: /sign in with google/i,
    });
    expect(signInButton).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(signInButton);

    expect(authMocks.signIn).toHaveBeenCalledWith("google");
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

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();

    const signOutButton = screen.getByRole("button", { name: /sign out/i });
    const user = userEvent.setup();
    await user.click(signOutButton);

    expect(authMocks.signOut).toHaveBeenCalled();
  });
});
