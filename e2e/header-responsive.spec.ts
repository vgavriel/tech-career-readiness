import { expect, test } from "@playwright/test";

test.describe("responsive header focus menu", () => {
  test.describe("mobile", () => {
    test.use({ viewport: { width: 390, height: 667 } });

    test("keeps focus controls reachable", async ({ page }) => {
      await page.goto("/lesson/start-to-finish-roadmap");
      await expect(
        page.getByRole("heading", { name: /start to finish/i })
      ).toBeVisible();

      await page.getByRole("button", { name: "Menu" }).click();
      const menuPanel = page.locator("#mobile-menu-panel");
      await expect(menuPanel).toBeVisible();

      const overflowY = await menuPanel.evaluate(
        (element) => getComputedStyle(element).overflowY
      );
      expect(overflowY).toBe("auto");

      const focusToggle = menuPanel.getByRole("button", { name: /^Focus/ });
      await focusToggle.click();
      const focusPanel = menuPanel.locator("#focus-menu-panel");
      await expect(focusPanel).toBeVisible();

      const clearButton = focusPanel.getByRole("button", {
        name: "Clear focus",
      });
      await clearButton.scrollIntoViewIfNeeded();
      await expect(clearButton).toBeVisible();
    });
  });

  test.describe("tablet", () => {
    test.use({ viewport: { width: 820, height: 1180 } });

    test("focus panel stays within menu bounds", async ({ page }) => {
      await page.goto("/lesson/start-to-finish-roadmap");
      await expect(
        page.getByRole("heading", { name: /start to finish/i })
      ).toBeVisible();

      await page.getByRole("button", { name: "Menu" }).click();
      const menuPanel = page.locator("#mobile-menu-panel");
      await expect(menuPanel).toBeVisible();

      const focusToggle = menuPanel.getByRole("button", { name: /^Focus/ });
      await focusToggle.click();

      const focusPanel = menuPanel.locator("#focus-menu-panel");
      await expect(focusPanel).toBeVisible();

      const panelBox = await menuPanel.boundingBox();
      const focusBox = await focusPanel.boundingBox();

      expect(panelBox).not.toBeNull();
      expect(focusBox).not.toBeNull();

      if (!panelBox || !focusBox) {
        throw new Error("Missing focus menu bounds for tablet viewport.");
      }

      expect(focusBox.x).toBeGreaterThanOrEqual(panelBox.x - 1);
      expect(focusBox.x + focusBox.width).toBeLessThanOrEqual(
        panelBox.x + panelBox.width + 1
      );
    });
  });

  test.describe("desktop", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("clear focus tooltip stays on-screen", async ({ page }) => {
      await page.goto("/lesson/start-to-finish-roadmap");
      await expect(
        page.getByRole("heading", { name: /start to finish/i })
      ).toBeVisible();

      const focusToggle = page.getByRole("button", { name: /^Focus/ }).first();
      await focusToggle.click();

      const clearButton = page.getByRole("button", {
        name: "Clear focus",
      });
      await clearButton.hover();

      const tooltip = page.getByRole("tooltip", {
        name: "No focus selected.",
      });
      await expect(tooltip).toBeVisible();

      const tooltipBox = await tooltip.boundingBox();
      const viewport = page.viewportSize();

      expect(tooltipBox).not.toBeNull();
      expect(viewport).not.toBeNull();

      if (!tooltipBox || !viewport) {
        throw new Error("Missing tooltip bounds for desktop viewport.");
      }

      expect(tooltipBox.x).toBeGreaterThanOrEqual(0);
      expect(tooltipBox.y).toBeGreaterThanOrEqual(0);
      expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(
        viewport.width
      );
    });
  });
});
