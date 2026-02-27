import { expect, test } from "@playwright/test";

test("legacy /roadmap route redirects to a lesson page", async ({ page }) => {
  await page.goto("/roadmap");

  await expect(page).toHaveURL(/\/lesson\/[a-z0-9-]+$/i);
  await expect(page.getByRole("complementary")).toContainText(/full curriculum/i);
});
