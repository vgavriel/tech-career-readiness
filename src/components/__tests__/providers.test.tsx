import { render, screen } from "@testing-library/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import Providers from "@/components/providers";

const sessionTracker = vi.hoisted(() => ({
  received: null as Session | null,
}));

vi.mock("next-auth/react", () => ({
  SessionProvider: ({
    session,
    children,
  }: {
    session: Session | null;
    children: ReactNode;
  }) => {
    sessionTracker.received = session;
    return <div data-testid="session-provider">{children}</div>;
  },
}));

describe("Providers", () => {
  it("passes session through and renders children", () => {
    const session = {
      user: { name: "Ada Lovelace", email: "ada@example.com" },
      expires: "2099-01-01T00:00:00.000Z",
    } satisfies Session;

    render(
      <Providers session={session}>
        <span>Child content</span>
      </Providers>
    );

    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
    expect(sessionTracker.received).toEqual(session);
  });
});
