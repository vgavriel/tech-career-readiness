import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SignInCta from "@/components/sign-in-cta";
import { devAuthDefaults } from "@/lib/dev-auth";

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  getProviders: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => authMocks.signIn(...args),
  getProviders: (...args: unknown[]) => authMocks.getProviders(...args),
}));

describe("SignInCta", () => {
  beforeEach(() => {
    authMocks.signIn.mockReset();
    authMocks.getProviders.mockReset();
    authMocks.getProviders.mockResolvedValue({
      google: { id: "google", name: "Google" },
    });
  });

  it("calls signIn with the default provider", async () => {
    render(<SignInCta>Sign in</SignInCta>);

    await waitFor(() => expect(authMocks.getProviders).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(authMocks.signIn).toHaveBeenCalledWith("google", undefined);
  });

  it("passes a callback URL when provided", async () => {
    render(<SignInCta callbackUrl="/lesson/intro">Sign in</SignInCta>);

    await waitFor(() => expect(authMocks.getProviders).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(authMocks.signIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/lesson/intro",
    });
  });

  it("uses credentials provider when available", async () => {
    authMocks.getProviders.mockResolvedValue({
      credentials: { id: "credentials", name: "Dev Login" },
    });

    render(<SignInCta>Sign in</SignInCta>);

    await waitFor(() => expect(authMocks.getProviders).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(authMocks.signIn).toHaveBeenCalledWith("credentials", {
      email: devAuthDefaults.email,
      name: devAuthDefaults.name,
    });
  });
});
