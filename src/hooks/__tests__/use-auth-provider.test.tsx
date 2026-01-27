import { render, screen, waitFor } from "@testing-library/react";
import type { ClientSafeProvider } from "next-auth/react";
import { getProviders } from "next-auth/react";
import { describe, expect, it, vi } from "vitest";

import { buildSignInOptions, useAuthProvider } from "@/hooks/use-auth-provider";

type ProvidersResponse = Awaited<ReturnType<typeof getProviders>>;

const buildProvider = (overrides: Partial<ClientSafeProvider>): ClientSafeProvider => ({
  id: "google",
  name: "Google",
  type: "oauth",
  signinUrl: "/api/auth/signin",
  callbackUrl: "/api/auth/callback",
  ...overrides,
});

const asProviders = (providers: Record<string, ClientSafeProvider>): ProvidersResponse =>
  providers as ProvidersResponse;

const ProviderStatus = () => {
  const provider = useAuthProvider();
  return (
    <div data-testid="provider">
      {provider.id}:{provider.label}:{provider.isDev ? "dev" : "prod"}
    </div>
  );
};

describe("useAuthProvider", () => {
  const getProvidersMock = vi.mocked(getProviders);

  it("prefers the Google provider when available", async () => {
    getProvidersMock.mockResolvedValueOnce(
      asProviders({
        google: buildProvider({ id: "google", name: "Google", type: "oauth" }),
      })
    );

    render(<ProviderStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("provider").textContent).toBe("google:Sign in with Google:prod");
    });
  });

  it("falls back to the dev credentials provider when present", async () => {
    getProvidersMock.mockResolvedValueOnce(
      asProviders({
        credentials: buildProvider({
          id: "credentials",
          name: "Dev Login",
          type: "credentials",
        }),
      })
    );

    render(<ProviderStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("provider").textContent).toBe("credentials:Sign in (dev):dev");
    });
  });

  it("uses the first provider when google/credentials are missing", async () => {
    getProvidersMock.mockResolvedValueOnce(
      asProviders({
        github: buildProvider({ id: "github", name: "GitHub", type: "oauth" }),
      })
    );

    render(<ProviderStatus />);

    await waitFor(() => {
      expect(screen.getByTestId("provider").textContent).toBe("github:Sign in with GitHub:prod");
    });
  });

  it("defaults to Google when provider lookup fails", async () => {
    getProvidersMock.mockRejectedValueOnce(new Error("boom"));

    render(<ProviderStatus />);

    await waitFor(() => {
      expect(getProvidersMock).toHaveBeenCalled();
      expect(screen.getByTestId("provider").textContent).toBe("google:Sign in with Google:prod");
    });
  });
});

describe("buildSignInOptions", () => {
  it("returns undefined when no options are needed", () => {
    expect(buildSignInOptions("google")).toBeUndefined();
  });

  it("includes callbackUrl when provided", () => {
    expect(buildSignInOptions("google", "/next")).toEqual({
      callbackUrl: "/next",
    });
  });

  it("adds dev credentials for the dev provider", () => {
    expect(buildSignInOptions("credentials")).toEqual({
      email: "dev@example.com",
      name: "Dev User",
    });
  });
});
