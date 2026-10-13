import { expect, type Page, test } from "@playwright/test";

import {
  recruitingHeadingIds,
  recruitingImageUrl,
  recruitingNotice,
  recruitingPath,
} from "./fixtures/recruiting-timeline";

const reader = (page: Page) => page.getByRole("main");
const timeline = (page: Page) => reader(page).getByTestId("recruiting-timeline");
const fullGuide = (page: Page) => reader(page).getByTestId("lesson-content");

async function expectHeading(page: Page, id: string) {
  const heading = reader(page).locator(`[id="${id}"]`);
  await expect(fullGuide(page)).toBeVisible();
  await expect(heading).toBeInViewport({ ratio: 1 });
  await expect
    .poll(() =>
      heading.evaluate((element) =>
        Math.abs(
          element.getBoundingClientRect().top - element.closest("main")!.getBoundingClientRect().top
        )
      )
    )
    .toBeLessThanOrEqual(17);
}

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-13T16:00:00Z"));
  // The fixture image is served locally by Playwright, never fetched from Google.
  await page.route(recruitingImageUrl, (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80"><rect width="160" height="80" fill="#e5d0b4"/></svg>',
    })
  );
});

test("renders source additions and supports season controls", async ({ page, isMobile }) => {
  await page.goto(recruitingPath);
  const current = timeline(page).getByRole("button", {
    name: "Sep–Oct Early Fall · You are here",
    exact: true,
  });
  await expect(current).toHaveAttribute("aria-pressed", "true");
  if (isMobile)
    await expect(page.getByRole("button", { name: "Open navigator", exact: true })).toBeVisible();
  await expect(timeline(page).getByText("Today", { exact: true })).toBeVisible();
  await expect(timeline(page).getByText(recruitingNotice)).toBeVisible();
  await expect(timeline(page).getByText("Apply & interview")).toHaveCount(0);
  await expect(timeline(page).getByRole("button", { name: "Read full guide" })).toHaveCount(0);
  await expect(timeline(page).getByRole("link", { name: /Open source Google Doc/ })).toHaveCount(0);
  const summer = timeline(page).getByRole("button", { name: "Jul–Aug Late Summer", exact: true });
  await summer.focus();
  await summer.press("Enter");
  await expect(summer).toBeFocused();
  await expect(summer).toHaveAttribute("aria-pressed", "true");
  await expect(current).toHaveAttribute("aria-current", "date");
  const image = timeline(page).getByRole("img", { name: "Recruiting fixture checklist" });
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
    .toBe(160);
  await timeline(page).getByRole("button", { name: "Back to now", exact: true }).click();
  await expect(current).toHaveAttribute("aria-pressed", "true");
  await expect(
    timeline(page).getByRole("link", { name: "technical interview prep", exact: true })
  ).toHaveAttribute("href", "/lesson/ace-interview-prep-timeline");
});

test("source headings and browser history override an earlier season selection", async ({
  page,
  isMobile,
}) => {
  const winterUrl = `${recruitingPath}#heading=${recruitingHeadingIds.winter}`;
  const springUrl = `${recruitingPath}#${recruitingHeadingIds.spring}`;
  await page.goto(winterUrl);
  await expect(
    timeline(page).getByRole("button", { name: "Back to now", exact: true })
  ).toBeVisible();
  if (isMobile)
    await expect(page.getByRole("button", { name: "Open navigator", exact: true })).toBeVisible();
  await expectHeading(page, recruitingHeadingIds.winter);
  await fullGuide(page).getByRole("link", { name: "Spring (March–April)", exact: true }).click();
  await expect(page).toHaveURL(springUrl);
  await expectHeading(page, recruitingHeadingIds.spring);
  await timeline(page).getByRole("button", { name: "Back to now", exact: true }).click();
  await expect(page).toHaveURL(recruitingPath);
  await expect(fullGuide(page)).toHaveCount(0);
  await expect(
    timeline(page).getByRole("heading", { name: "Early Fall", exact: true })
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(springUrl);
  await expectHeading(page, recruitingHeadingIds.spring);
  await page.goBack();
  await expect(page).toHaveURL(winterUrl);
  await expectHeading(page, recruitingHeadingIds.winter);
  await page.goForward();
  await expect(page).toHaveURL(springUrl);
  await expectHeading(page, recruitingHeadingIds.spring);
  await page.goForward();
  await expect(page).toHaveURL(recruitingPath);
  await expect(fullGuide(page)).toHaveCount(0);
});

test("resources align in both themes and stack without overflow on mobile", async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto(recruitingPath);
  const resources = timeline(page).getByRole("complementary", {
    name: "Essential Brown resources",
  });
  const items = resources.locator("li");
  await expect(items).toHaveCount(3);
  await expect(page.locator("html")).toHaveAttribute("data-theme", /^(light|dark)$/);
  if (isMobile)
    await expect(page.getByRole("button", { name: "Open navigator", exact: true })).toBeVisible();
  for (const theme of ["light", "dark"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
      await page.getByRole("button", { name: /Switch to .* mode/ }).click();
    }
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await resources.scrollIntoViewIfNeeded();
    const boxes = await items.evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return {
          top: box.top,
          bottom: box.bottom,
          left: box.left,
          margin: getComputedStyle(element).marginTop,
        };
      })
    );
    expect(boxes.map((box) => box.margin)).toEqual(["0px", "0px", "0px"]);
    for (let i = 1; i < boxes.length; i++) {
      if (isMobile) {
        expect(Math.abs(boxes[i].left - boxes[0].left)).toBeLessThanOrEqual(1);
        expect(boxes[i].top - boxes[i - 1].bottom).toBeGreaterThanOrEqual(12);
        expect(boxes[i].top - boxes[i - 1].bottom).toBeLessThanOrEqual(14);
      } else expect(Math.abs(boxes[i].top - boxes[0].top)).toBeLessThanOrEqual(1);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    expect(
      await timeline(page).evaluate((element) => element.scrollWidth <= element.clientWidth)
    ).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`resources-${theme}.png`) });
  }
});
