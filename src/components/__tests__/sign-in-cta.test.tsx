import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SignInCta from "@/components/sign-in-cta";

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => authMocks.signIn(...args),
}));

describe("SignInCta", () => {
  beforeEach(() => {
    authMocks.signIn.mockReset();
  });

  it("calls signIn with the default provider", async () => {
    render(<SignInCta>Sign in</SignInCta>);

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(authMocks.signIn).toHaveBeenCalledWith("google", undefined);
  });

  it("passes a callback URL when provided", async () => {
    render(<SignInCta callbackUrl="/lesson/intro">Sign in</SignInCta>);

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(authMocks.signIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/lesson/intro",
    });
  });
});
