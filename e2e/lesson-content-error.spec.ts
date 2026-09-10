import { expect, test } from "@playwright/test";

test("shows a helpful error state when lesson content fails", async ({ page }) => {
  await page.goto("/lesson/lesson-content-error-test");

  // Streamed HTML can include a hidden copy outside the active main content.
  const main = page.getByRole("main");
  await expect(main.getByText(/lesson content is unavailable right now/i)).toBeVisible();
  await expect(main.getByRole("link", { name: /try again/i })).toBeVisible();
});
