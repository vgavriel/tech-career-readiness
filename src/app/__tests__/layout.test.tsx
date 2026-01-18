import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

const authUserMocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: authMocks.getServerSession,
}));

vi.mock("@/lib/auth-user", () => ({
  getAuthenticatedUser: authUserMocks.getAuthenticatedUser,
}));

vi.mock("@/components/providers", () => ({
  default: ({ children }: { children: ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}));

vi.mock("@/components/site-header", () => ({
  default: () => <div data-testid="site-header" />,
}));

describe("RootLayout", () => {
  it("wraps the app with providers and renders children", async () => {
    authMocks.getServerSession.mockResolvedValue(null);
    authUserMocks.getAuthenticatedUser.mockResolvedValue(null);

    const { authOptions } = await import("@/lib/auth");
    const RootLayout = (await import("@/app/layout")).default;

    const ui = await RootLayout({ children: <div>Page content</div> });
    const html = renderToStaticMarkup(ui);

    expect(authMocks.getServerSession).toHaveBeenCalledWith(authOptions);
    expect(authUserMocks.getAuthenticatedUser).toHaveBeenCalledWith(null);
    expect(html).toContain('data-testid="providers"');
    expect(html).toContain('data-testid="site-header"');
    expect(html).toContain("Page content");
  });
});
