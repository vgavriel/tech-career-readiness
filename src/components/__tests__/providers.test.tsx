import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import Providers from "@/components/providers";
import type { Session } from "@/lib/auth-types";
import { reportClientError } from "@/lib/client-error";

const sessionTracker = vi.hoisted(() => ({
  received: null as Session | null,
}));

const progressTracker = vi.hoisted(() => ({
  rendered: false,
}));

vi.mock("@/components/progress-provider", () => ({
  ProgressProvider: ({ children }: { children: ReactNode }) => {
    progressTracker.rendered = true;
    return <div data-testid="progress-provider">{children}</div>;
  },
}));

vi.mock("@/lib/client-error", () => ({
  reportClientError: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ session, children }: { session: Session | null; children: ReactNode }) => {
    sessionTracker.received = session;
    return <div data-testid="session-provider">{children}</div>;
  },
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));

describe("Providers", () => {
  it("passes session through and renders children", () => {
    const session = {
      user: { name: "Ada Lovelace", email: "ada@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    } satisfies Session;

    render(
      <Providers session={session} analyticsEnabled={false}>
        <span>Child content</span>
      </Providers>
    );

    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
    expect(screen.getByTestId("progress-provider")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
    expect(sessionTracker.received).toEqual(session);
    expect(progressTracker.rendered).toBe(true);
  });

  it("reports window errors and unhandled rejections", async () => {
    render(
      <Providers session={null} analyticsEnabled={false}>
        <span>Child content</span>
      </Providers>
    );

    const error = new Error("Boom");
    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "Boom",
        error,
        filename: "app.tsx",
        lineno: 12,
        colno: 4,
      })
    );

    const rejectionEvent = new PromiseRejectionEvent("unhandledrejection", {
      promise: Promise.resolve(),
      reason: new Error("Nope"),
    });
    window.dispatchEvent(rejectionEvent);

    await waitFor(() => {
      expect(reportClientError).toHaveBeenCalled();
    });
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Boom",
        source: "app.tsx",
      })
    );
  });
});
