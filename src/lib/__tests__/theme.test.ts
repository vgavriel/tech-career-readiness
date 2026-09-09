import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";

import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "@/lib/theme";
import { proxy } from "@/proxy";

describe("theme initialization", () => {
  it.each([
    [null, "light"],
    ["invalid", "light"],
    ["light", "light"],
    ["dark", "dark"],
  ])("applies saved value %s as %s before rendering", (saved, expected) => {
    const root = { dataset: {} };
    const getItem = vi.fn(() => saved);
    runInNewContext(THEME_INIT_SCRIPT, {
      document: { documentElement: root },
      localStorage: { getItem },
      window: { addEventListener: vi.fn() },
    });
    expect(getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
    expect(root.dataset).toEqual({ theme: expected });
  });

  it("defaults to light when accessing browser storage is blocked", () => {
    const root = { dataset: {} };
    runInNewContext(THEME_INIT_SCRIPT, {
      document: { documentElement: root },
      window: { addEventListener: vi.fn() },
      get localStorage() {
        throw new Error("Storage blocked");
      },
    });
    expect(root.dataset).toEqual({ theme: "light" });
  });

  it("handles other-tab changes even before React loads", () => {
    const root = { dataset: { theme: "light" } };
    const addEventListener = vi.fn();
    runInNewContext(THEME_INIT_SCRIPT, {
      document: { documentElement: root },
      localStorage: { getItem: () => "dark" },
      window: { addEventListener },
    });
    expect(addEventListener).toHaveBeenCalledWith("storage", expect.any(Function));
    const onStorage = addEventListener.mock.calls[0][1];
    onStorage({ key: "unrelated", newValue: "light" });
    expect(root.dataset.theme).toBe("dark");
    onStorage({ key: THEME_STORAGE_KEY, newValue: "light" });
    expect(root.dataset.theme).toBe("light");
    onStorage({ key: THEME_STORAGE_KEY, newValue: "dark" });
    expect(root.dataset.theme).toBe("dark");
    onStorage({ key: null, newValue: null });
    expect(root.dataset.theme).toBe("light");
  });

  it("permits the exact initializer under the existing content security policy", () => {
    const response = proxy(
      new NextRequest("http://localhost/", { headers: { accept: "text/html" } })
    );
    const csp = response.headers.get("Content-Security-Policy");
    const hash = createHash("sha256").update(THEME_INIT_SCRIPT).digest("base64");
    expect(csp).toContain(`'sha256-${hash}'`);
    expect(csp).toContain("'nonce-");
    expect(csp).not.toContain("'unsafe-inline'");
  });
});
