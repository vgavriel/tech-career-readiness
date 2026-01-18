import { expect, test } from "@playwright/test";

test("public browsing from landing to lesson content", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /land your first tech role/i,
    })
  ).toBeVisible();

  await Promise.all([
    page.waitForURL(/\/lesson\/start-to-finish-roadmap/, { timeout: 15000 }),
    page.getByRole("link", { name: /start the course/i }).click(),
  ]);

  await expect(
    page.getByRole("heading", { name: /start to finish/i })
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("complementary")).toContainText(
    /full curriculum/i
  );
  await expect(
    page.getByText(/sample lesson content for tests/i)
  ).toBeVisible();
});
