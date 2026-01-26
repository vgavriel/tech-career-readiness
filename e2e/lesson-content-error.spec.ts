import { expect, test } from "@playwright/test";

test("shows a helpful error state when lesson content fails", async ({
  page,
}) => {
  await page.goto("/lesson/lesson-content-error-test");

  await expect(
    page.getByText(/lesson content is unavailable right now/i)
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /try again/i })).toBeVisible();
});
