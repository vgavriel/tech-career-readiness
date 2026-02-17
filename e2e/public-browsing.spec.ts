import { expect, test } from "@playwright/test";

test("public browsing from landing to lesson content", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /step-by-step prep for tech recruiting at brown/i,
    })
  ).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/lesson\/start-to-finish-roadmap/),
    page.getByRole("link", { name: /start course/i }).click(),
  ]);

  await expect(page.getByRole("heading", { name: /start to finish/i })).toBeVisible();
  await expect(page.getByRole("complementary")).toContainText(/full curriculum/i);
  await expect(page.getByText(/Pick a focus if you are on a deadline./i)).toBeVisible();
});
