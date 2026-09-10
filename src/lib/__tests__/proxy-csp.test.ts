import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("CSP transport policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([
    ["development", "local", false],
    ["test", "test", false],
    ["production", "test", false],
    ["production", "preview", true],
    ["production", "production", true],
  ] as const)(
    "sets HTTPS upgrading correctly for NODE_ENV=%s, APP_ENV=%s",
    async (environment, appEnvironment, shouldUpgrade) => {
      vi.stubEnv("NODE_ENV", environment);
      vi.stubEnv("APP_ENV", appEnvironment);
      vi.resetModules();
      const { proxy } = await import("@/proxy");
      const response = proxy(
        new NextRequest("http://localhost:3000/", { headers: { accept: "text/html" } })
      );
      const csp = response.headers.get("Content-Security-Policy");
      expect(csp?.includes("upgrade-insecure-requests")).toBe(shouldUpgrade);
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("'nonce-");
      expect(csp).not.toContain("'unsafe-inline'");
    }
  );
});
