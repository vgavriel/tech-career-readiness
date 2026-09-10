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
  return focusPanel;
};

test("secondary pages render and focus selection persists", async ({ page }) => {
  await page.goto("/gold-stars");
  await expect(page.getByRole("heading", { name: /gold stars/i, level: 1 })).toBeVisible();

  const signInButton = page.getByRole("button", {
    name: /sign in \(dev\)/i,
  });
  await expect(signInButton.first()).toBeVisible();
  await expect(signInButton.first()).toBeEnabled();
  // Finish the initial focus read before changing the selection.
  const [initialFocusResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/focus" && response.request().method() === "GET"
    ),
    signInButton.first().click(),
  ]);
  expect(initialFocusResponse.ok()).toBe(true);
  const initialFocus = (await initialFocusResponse.json()) as { focusKey: string | null };
  await expect(page.getByText(/signed in as:/i)).toBeVisible();

  // Always change the stored value, including when repeating this test against the same DB.
  const nextFocus =
    initialFocus.focusKey === "just-starting"
      ? { key: "applying-soon", label: "Applying soon" }
      : { key: "just-starting", label: "Just starting" };
  const focusToggle = page.getByRole("button", { name: /^Focus/ }).first();
  const focusPanel = await openFocusMenu(focusToggle, page);

  // Hold the real save until the optimistic label renders. That label alone is not persistence.
  let releaseSave!: () => void;
  const saveGate = new Promise<void>((resolve) => {
    releaseSave = resolve;
  });
  await page.route("**/api/focus", async (route) => {
    if (route.request().method() === "POST") {
      await saveGate;
    }
    await route.continue();
  });

  const selectedFocus = page.getByRole("button", {
    name: `Focus: ${nextFocus.label}`,
    exact: true,
  });
  const [savedFocusResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/focus" && response.request().method() === "POST"
    ),
    (async () => {
      try {
        await focusPanel.getByRole("button", { name: new RegExp(nextFocus.label, "i") }).click();
        await expect(selectedFocus).toBeVisible();
      } finally {
        releaseSave();
      }
    })(),
  ]);
  expect(savedFocusResponse.ok()).toBe(true);
  expect(await savedFocusResponse.json()).toEqual({ focusKey: nextFocus.key });

  await page.goto("/roles");
  await expect(page.getByRole("heading", { name: /explore .*tech roles/i })).toBeVisible();
  await expect(selectedFocus).toBeVisible();
});
