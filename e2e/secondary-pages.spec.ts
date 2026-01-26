import { expect, test } from "@playwright/test";

test("secondary pages render and focus selection persists", async ({ page }) => {
  await page.goto("/gold-stars");
  await expect(
    page.getByRole("heading", { name: /gold stars/i, level: 1 })
  ).toBeVisible();

  const signInButton = page.getByRole("button", { name: /sign in/i }).first();
  if (await signInButton.isVisible()) {
    await signInButton.click();
    await expect(page.getByText(/signed in as:/i)).toBeVisible({
      timeout: 15000,
    });
  }

  const focusToggle = page
    .getByRole("button", { name: /^Focus/ })
    .first();
  await focusToggle.click();
  await expect(page.locator("#focus-menu-panel")).toBeVisible();

  await page.getByRole("button", { name: /just starting/i }).click();
  await expect(
    page.getByRole("button", { name: /focus: just starting/i })
  ).toBeVisible();

  await page.goto("/roles");
  await expect(
    page.getByRole("heading", { name: /explore brown-specific tech roles/i })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /focus: just starting/i })
  ).toBeVisible();
});
