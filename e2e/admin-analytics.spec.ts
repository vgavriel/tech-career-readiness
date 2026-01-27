import { expect, type Page, test } from "@playwright/test";

const signInDevUser = async (page: Page) => {
  const signInButton = page.getByRole("button", {
    name: /sign in \(dev\)/i,
  });
  await expect(signInButton.first()).toBeVisible({ timeout: 15000 });
  await signInButton.first().click();
  await expect(page.getByText(/signed in as:/i)).toBeVisible({ timeout: 15000 });
};

test("admin analytics redirects when unauthenticated", async ({ page }) => {
  await page.goto("/admin/analytics");
  await expect(page).toHaveURL(/\/api\/auth\/signin/);
});

test("admin analytics renders for admin users", async ({ page }) => {
  await page.goto("/");
  await signInDevUser(page);

  await page.goto("/admin/analytics");

  await expect(
    page.getByRole("heading", { name: /usage, progress, and timelines/i })
  ).toBeVisible();
});
