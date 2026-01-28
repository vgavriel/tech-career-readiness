import { expect, test } from "@playwright/test";

test("shows a not-found state for unknown lessons", async ({ page }) => {
  await page.goto("/lesson/this-lesson-does-not-exist");

  await expect(
    page.getByRole("heading", { name: /we could not find that lesson/i })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /back to course/i })
  ).toBeVisible();
});
