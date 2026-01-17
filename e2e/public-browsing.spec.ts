import { expect, test } from "@playwright/test";

test("public browsing from landing to lesson content", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /land your first tech role/i,
    })
  ).toBeVisible();

  await page.getByRole("link", { name: /start the roadmap/i }).click();
  await expect(page).toHaveURL(/\/roadmap/);

  await expect(
    page.getByRole("heading", {
      name: /your focused path through tech recruiting/i,
    })
  ).toBeVisible();

  await page.getByRole("link", { name: /start to finish/i }).click();
  await expect(page).toHaveURL(/\/lesson\/start-to-finish-roadmap/);

  await expect(
    page.getByRole("heading", { name: /start to finish/i })
  ).toBeVisible();
  await expect(
    page.getByText(/sample lesson content for tests/i)
  ).toBeVisible();
});
