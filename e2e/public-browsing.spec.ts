import { expect, test } from "@playwright/test";

test("public browsing from landing to lesson content", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /structured path from student to hired engineer/i,
    })
  ).toBeVisible();

  await page.getByRole("link", { name: /view the roadmap/i }).click();
  await expect(page).toHaveURL(/\/roadmap/);

  await expect(
    page.getByRole("heading", { name: /your path through tech recruiting/i })
  ).toBeVisible();

  await page.getByRole("link", { name: /define your goal/i }).click();
  await expect(page).toHaveURL(/\/lesson\/define-your-goal/);

  await expect(
    page.getByRole("heading", { name: /define your goal/i })
  ).toBeVisible();
  await expect(
    page.getByText(/sample lesson content for tests/i)
  ).toBeVisible();
});
