import { expect, test } from "@playwright/test";

const storageKey = "tcr-theme";

test("theme stays in this browser through sign-in and sign-out", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.getByRole("button", { name: "Sign in (dev)", exact: true }).click();
  await expect(page.getByText(/signed in as:/i)).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("link", { name: "Gold Stars", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Gold Stars", level: 1 })).toBeVisible();
  const headerBounds = await page.getByRole("banner").evaluate((header) => {
    const controls = [...header.querySelectorAll("a, button")].filter(
      (el) => el.getClientRects().length
    );
    return controls.every((el) => el.getBoundingClientRect().right <= window.innerWidth);
  });
  expect(headerBounds).toBe(true);
  await expect(page.locator(".theme-toggle svg")).toHaveCSS("transition-duration", "1e-06s");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign in (dev)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe("dark");
});

test("theme persists through lesson navigation, reloads, and another tab", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Switch to dark mode" });
  await expect(toggle).toBeVisible();
  await expect(page.locator(".theme-toggle-moon")).toBeVisible();
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".theme-toggle-sun")).toBeVisible();
  await expect(page.locator(".theme-toggle-moon")).toBeHidden();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe("dark");

  await page.getByRole("link", { name: /start course/i }).click();
  await expect(page.getByRole("heading", { name: /start to finish/i })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeVisible();

  const otherTab = await context.newPage();
  await otherTab.goto("/privacy");
  await expect(otherTab.locator("html")).toHaveAttribute("data-theme", "dark");
  const lightToggle = page.getByRole("button", { name: "Switch to light mode" });
  await lightToggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(otherTab.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("saved dark theme is applied before React can hydrate", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "dark"), storageKey);
  await page.route("**/_next/**/*.js*", (route) => route.abort());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(25, 23, 21)");
});

test("toggle still works when the browser blocks localStorage", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

for (const width of [320, 390, 820, 1024, 1280, 1440]) {
  test(`theme control and navigation fit a ${width}px header`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/lesson/start-to-finish-roadmap");
    const toggle = page.getByRole("button", { name: "Switch to dark mode" });
    await expect(toggle).toBeVisible();
    const box = await toggle.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    await toggle.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Switch to light mode" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Switch to light mode" })).toHaveCSS(
      "outline-style",
      "solid"
    );
    if (width < 1280) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await expect(page.locator("#mobile-menu-panel")).toBeVisible();
      await expect(
        page.locator("#mobile-menu-panel").getByRole("link", { name: "Gold Stars" })
      ).toBeVisible();
    }
    const headerFits = await page.getByRole("banner").evaluate((header) =>
      [...header.querySelectorAll("a, button")]
        .filter((el) => el.getClientRects().length)
        .every((el) => {
          const bounds = el.getBoundingClientRect();
          return bounds.x >= 0 && bounds.right <= window.innerWidth;
        })
    );
    expect(headerFits).toBe(true);
  });
}
