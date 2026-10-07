import { createHash } from "node:crypto";

import { expect, test } from "@playwright/test";

test("production pages hydrate under the enforced CSP with fresh nonces", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/content.security.policy/i.test(message.text())) errors.push(message.text());
  });

  let previousNonce: string | undefined;
  // Repeat a URL to catch accidentally cached HTML, then exercise a lesson document.
  for (const path of ["/", "/", "/lesson/start-to-finish-roadmap"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const policy = response?.headers()["content-security-policy"] ?? "";
    const scriptPolicy = policy.match(/(?:^|;)\s*script-src\s+([^;]+)/)?.[1] ?? "";
    const nonce = scriptPolicy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce, "HTML must have a request-specific script nonce").toBeTruthy();
    expect(nonce).not.toBe(previousNonce);
    expect(scriptPolicy).not.toMatch(/'unsafe-(?:inline|eval)'/);
    previousNonce = nonce;

    const inlineScripts = await page.evaluate(() =>
      [...document.scripts]
        .filter(
          (script) =>
            !script.src &&
            (!script.type || /^(?:text|application)\/javascript$|^module$/.test(script.type))
        )
        .map((script) => ({ nonce: script.nonce, content: script.textContent ?? "" }))
    );
    expect(inlineScripts.length).toBeGreaterThan(0);
    const unauthorizedScripts = inlineScripts.filter((script) => {
      const hash = createHash("sha256").update(script.content).digest("base64");
      return script.nonce !== nonce && !scriptPolicy.includes(`'sha256-${hash}'`);
    });
    expect(unauthorizedScripts, `Inline scripts must be authorized by the CSP on ${path}`).toEqual(
      []
    );
    expect(errors, `Browser startup errors on ${path}`).toEqual([]);

    const toggle = page.getByRole("button", { name: /Switch to (?:dark|light) mode/ });
    await expect(toggle).toBeEnabled({ timeout: 10_000 });
    const initialTheme = await page.locator("html").getAttribute("data-theme");
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      initialTheme === "dark" ? "light" : "dark",
      { timeout: 10_000 }
    );
    expect(errors, `Browser hydration errors on ${path}`).toEqual([]);
  }
});
