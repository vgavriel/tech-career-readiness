import { expect, type Locator, type Page, test } from "@playwright/test";

const openFocusMenu = async (focusToggle: Locator, page: Page) => {
  const focusPanelId = await focusToggle.getAttribute("aria-controls");
  expect(focusPanelId).toBeTruthy();
  const focusPanel = page.locator(`#${focusPanelId}`);

  await expect(async () => {
    if ((await focusToggle.getAttribute("aria-expanded")) !== "true") {
      await focusToggle.click();
    }

    await expect(focusPanel).toBeVisible({ timeout: 10_000 });
  }).toPass();
};

test("secondary pages render and focus selection persists", async ({ page }) => {
  await page.goto("/gold-stars");
  await expect(page.getByRole("heading", { name: /gold stars/i, level: 1 })).toBeVisible();

  const signInButton = page.getByRole("button", {
    name: /sign in \(dev\)/i,
  });
  await expect(signInButton.first()).toBeVisible();
  await expect(signInButton.first()).toBeEnabled();
  await signInButton.first().click();
  await expect(page.getByText(/signed in as:/i)).toBeVisible();

  const focusToggle = page.getByRole("button", { name: /^Focus/ }).first();
  await openFocusMenu(focusToggle, page);

  await page.getByRole("button", { name: /just starting/i }).click();
  await expect(page.getByRole("button", { name: /focus: just starting/i })).toBeVisible();

  await page.goto("/roles");
  await expect(page.getByRole("heading", { name: /explore .*tech roles/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /focus: just starting/i })).toBeVisible();
});
