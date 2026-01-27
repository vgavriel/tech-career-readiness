import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const ensureLessonReady = async (page: Page) => {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /mark complete|mark incomplete/i })).toBeVisible();
};

const resetToIncomplete = async (page: Page) => {
  await expect(page.getByRole("button", { name: /mark complete|mark incomplete/i })).toBeVisible();
  const markIncomplete = page.getByRole("button", { name: "Mark incomplete" });
  if (await markIncomplete.isVisible()) {
    await markIncomplete.click();
  }
  await expect(page.getByRole("button", { name: "Mark complete" })).toBeVisible();
};

const signInDevUser = async (page: Page) => {
  const signInButton = page.getByRole("button", {
    name: /sign in \(dev\)/i,
  });
  await expect(signInButton.first()).toBeVisible({ timeout: 15000 });
  await signInButton.first().click();
  await expect(page.getByText(/signed in as:/i)).toBeVisible({ timeout: 15000 });
};

test.describe("progress flows", () => {
  test("persists authenticated progress and updates the continue CTA", async ({ page }) => {
    await page.goto("/lesson/start-to-finish-roadmap");
    await ensureLessonReady(page);
    await signInDevUser(page);
    await resetToIncomplete(page);

    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

    await page.reload();
    await ensureLessonReady(page);
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

    await page.goto("/");
    const progressBar = page.getByRole("progressbar").first();
    await expect(progressBar).toHaveAttribute("aria-valuetext", /complete/i);
    const cta = page.getByRole("link", { name: /course/i });
    await expect(cta).toBeVisible();
    const label = (await cta.textContent())?.toLowerCase() ?? "";
    expect(label).not.toContain("start course");
  });

  test("merges guest progress into the account on sign-in", async ({ page }) => {
    const lessonSlug = "ace-interview-prep-timeline";
    await page.goto(`/lesson/${lessonSlug}`);
    await ensureLessonReady(page);
    await page.evaluate(() => localStorage.removeItem("tcr-guest-progress"));

    await resetToIncomplete(page);
    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();

    const stored = await page.evaluate(() => localStorage.getItem("tcr-guest-progress"));
    expect(stored).toContain(lessonSlug);

    await signInDevUser(page);
    await expect(page.getByRole("button", { name: "Mark incomplete" })).toBeVisible();
    await page.waitForFunction(() => !localStorage.getItem("tcr-guest-progress"));
  });
});
