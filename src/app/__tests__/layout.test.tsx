import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/app-shell", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("wraps the app with the app shell and renders children", async () => {
    const RootLayout = (await import("@/app/layout")).default;

    const ui = await RootLayout({ children: <div>Page content</div> });
    const html = renderToStaticMarkup(ui);

    expect(html).toContain('data-testid="app-shell"');
    expect(html).toContain('href="#main-content"');
    expect(html).toContain("Page content");
  });
});
