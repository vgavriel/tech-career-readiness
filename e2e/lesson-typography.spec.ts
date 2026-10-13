import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} lesson typography`, () => {
    test.beforeEach(async ({ page, isMobile }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript((value) => localStorage.setItem("tcr-theme", value), theme);
      await page.goto("/lesson/popular-tech-roles");
      await expect(page.getByRole("button", { name: /switch to .* mode/i })).toBeEnabled();
      if (isMobile) {
        await expect(
          page.getByRole("button", { name: "Open navigator", exact: true })
        ).toBeVisible();
      }
    });

    test("headings group with their content and descend in visual size", async ({
      page,
      isMobile,
    }, testInfo) => {
      const content = page.getByRole("main").getByTestId("lesson-content");
      const sections = content.locator("#typography-sections");
      await expect(sections).toBeAttached();
      const headings = await sections.locator("h1, h2, h3, h4, h5, h6").evaluateAll((elements) =>
        elements.map((heading) => {
          const rect = heading.getBoundingClientRect();
          const previous = heading.previousElementSibling!;
          const next = heading.nextElementSibling!;
          const style = getComputedStyle(heading);
          return {
            id: heading.id,
            level: Number(heading.tagName.slice(1)),
            fontSize: parseFloat(style.fontSize),
            weight: getComputedStyle(heading.querySelector("span") ?? heading).fontWeight,
            fontFamily: style.fontFamily,
            height: rect.height,
            lineHeight: parseFloat(style.lineHeight),
            before: rect.top - previous.getBoundingClientRect().bottom,
            after: next.getBoundingClientRect().top - rect.bottom,
            previousIsHeading: /^H[1-6]$/.test(previous.tagName),
            nextIsHeading: /^H[1-6]$/.test(next.tagName),
          };
        })
      );

      expect(headings).toHaveLength(12);
      for (const heading of headings) {
        expect(heading.weight, `${heading.id} must not depend on imported bold spans`).toBe("700");
        expect(heading.fontFamily).toBe(headings[0].fontFamily);
        if (heading.previousIsHeading) {
          expect(heading.before, "Consecutive headings stay grouped").toBeLessThanOrEqual(12);
          expect(heading.before).toBeGreaterThanOrEqual(8);
        } else if (!heading.nextIsHeading) {
          expect(heading.after, `${heading.id} keeps its content nearby`).toBeGreaterThanOrEqual(6);
          expect(heading.after).toBeLessThanOrEqual(10);
          expect(
            heading.before,
            `${heading.id} belongs with the following block`
          ).toBeGreaterThanOrEqual(heading.after * 2);
        }
      }
      const [h1, h2, h3] = headings;
      expect(h1.fontSize).toBeGreaterThan(h2.fontSize);
      expect(h2.fontSize).toBeGreaterThan(h3.fontSize);
      expect(h1.before).toBeGreaterThan(h2.before);
      expect(h2.before).toBeGreaterThan(h3.before);
      expect(h3.fontSize).toBeGreaterThanOrEqual(16);
      expect(
        headings
          .filter((heading) => heading.level >= 4)
          .every((heading) => heading.fontSize <= h3.fontSize)
      ).toBe(true);
      if (isMobile) expect(h3.height).toBeGreaterThan(h3.lineHeight * 1.5);
      expect(
        await content.evaluate((element) => element.scrollWidth - element.clientWidth)
      ).toBeLessThanOrEqual(1);

      await content.locator("#typography-h1").scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath("heading-hierarchy.png") });
      await content.locator("#typography-h3").scrollIntoViewIfNeeded();
      await page.screenshot({ path: testInfo.outputPath("heading-subsection.png") });

      const link = sections.getByRole("link", { name: "Return to the roadmap", exact: true });
      await link.focus();
      await expect(link).toBeFocused();
      expect(
        await link.evaluate((element) => parseFloat(getComputedStyle(element).outlineWidth))
      ).toBeGreaterThan(0);
      await link.press("Enter");
      await expect(page).toHaveURL(/\/lesson\/start-to-finish-roadmap/);
      await expect(page.getByRole("main").getByTestId("lesson-content")).toContainText(
        "Welcome to the roadmap"
      );
    });

    test("first headings have no extra gap, including inside a document wrapper", async ({
      page,
    }) => {
      const content = page.getByRole("main").getByTestId("lesson-content");
      const firstHeading = content.locator("h2").first();
      await expect(firstHeading).toHaveCSS("margin-top", "0px");
      // Google Docs may leave a wrapper; preserve the exact same reader content.
      await content.evaluate((element) => {
        const wrapper = document.createElement("div");
        wrapper.append(...element.childNodes);
        element.append(wrapper);
      });
      await expect(firstHeading).toHaveCSS("margin-top", "0px");
      await expect(content.locator("#typography-h2")).toHaveCSS("font-weight", "700");
    });
  });
}
