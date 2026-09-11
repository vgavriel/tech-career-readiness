import { expect, type Locator, type Page, test } from "@playwright/test";

const roadmapPath = "/lesson/start-to-finish-roadmap";

const lessonContent = (page: Page) => page.getByRole("main").getByTestId("lesson-content");

/** Check the actual scroll geometry, including ancestors that can hide extra page space. */
const expectSingleLessonScroller = async (page: Page) => {
  const geometry = await page.getByRole("main").evaluate((main) => {
    const rect = main.getBoundingClientRect();
    const outerOverflow = [];
    for (let parent = main.parentElement; parent; parent = parent.parentElement) {
      // The body is not the document scroller in standards mode. Next's dev-only
      // overlay can extend its scrollHeight even though the document cannot scroll.
      if (parent === document.body) continue;
      outerOverflow.push({
        element: parent.tagName,
        vertical: parent.scrollHeight - parent.clientHeight,
        horizontal: parent.scrollWidth - parent.clientWidth,
        scrollTop: parent.scrollTop,
      });
    }
    return {
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: window.visualViewport?.height ?? window.innerHeight,
      horizontalOverflow: main.scrollWidth - main.clientWidth,
      outerOverflow,
    };
  });

  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
  expect(geometry.horizontalOverflow).toBeLessThanOrEqual(1);
  for (const parent of geometry.outerOverflow) {
    expect(
      parent.vertical,
      `${parent.element} has extra vertical scroll space`
    ).toBeLessThanOrEqual(1);
    expect(parent.horizontal, `${parent.element} overflows horizontally`).toBeLessThanOrEqual(1);
    expect(parent.scrollTop).toBe(0);
  }
};

/** Scroll only the lesson pane; locator auto-scrolling could conceal a nested scroll trap. */
const scrollLessonToEnd = async (page: Page) => {
  await expect(async () => {
    // A resize can change the scroll range after the first scroll. Retry the
    // action as well as the measurement, instead of polling a stale position.
    const remaining = await page.getByRole("main").evaluate((main) => {
      main.scrollTo({ top: main.scrollHeight, behavior: "instant" });
      return Math.abs(main.scrollHeight - main.clientHeight - main.scrollTop);
    });
    expect(remaining).toBeLessThanOrEqual(1);
    await expectSingleLessonScroller(page);
    // Keep this inner wait short so it cannot consume the entire retry budget.
    await expect(visibleNextLink(page)).toBeInViewport({ ratio: 1, timeout: 100 });
  }).toPass({ timeout: 5_000 });
};

const visibleNextLink = (page: Page) =>
  page.getByRole("main").getByRole("link", { name: /^(Next|Next core lesson)$/ });

/** Use coordinates so the action cannot silently scroll an offscreen control into view. */
const activateVisibleLink = async (page: Page, link: Locator, hasTouch: boolean) => {
  await expect(link).toBeInViewport({ ratio: 1 });
  const box = await link.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("Missing next lesson link bounds.");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (hasTouch) {
    await page.touchscreen.tap(x, y);
  } else {
    await page.mouse.click(x, y);
  }
};

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} lesson layout`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript((value) => localStorage.setItem("tcr-theme", value), theme);
    });

    test("one pane reaches the lesson end and Next without excess scroll space", async ({
      page,
      hasTouch,
    }, testInfo) => {
      await page.goto("/");
      await page.getByRole("link", { name: /start course/i }).click();
      await expect(page).toHaveURL(new RegExp(roadmapPath));
      const content = lessonContent(page);
      await expect(content).toBeVisible();
      await expect(content).toContainText("Welcome to the roadmap");
      await expect(visibleNextLink(page)).toBeAttached();
      await expectSingleLessonScroller(page);
      await expect(visibleNextLink(page)).not.toBeInViewport();
      expect(
        await page.getByRole("main").evaluate((main) => main.scrollHeight - main.clientHeight)
      ).toBeGreaterThan(100);

      await scrollLessonToEnd(page);
      await expect(content.locator(":scope > p").last()).toBeInViewport({ ratio: 1 });
      await expect(visibleNextLink(page)).toBeInViewport({ ratio: 1 });
      const endGap = await visibleNextLink(page).evaluate(
        (link) =>
          link.closest("main")!.getBoundingClientRect().bottom - link.getBoundingClientRect().bottom
      );
      expect(endGap).toBeGreaterThanOrEqual(0);
      expect(endGap, "No empty viewport after the final action").toBeLessThan(120);
      await expectSingleLessonScroller(page);
      await page.screenshot({ path: testInfo.outputPath("lesson-end.png") });

      await activateVisibleLink(page, visibleNextLink(page), hasTouch);
      await expect(page).toHaveURL(/\/lesson\/tech-recruiting-timeline/);
      await expect(
        page.getByRole("heading", { level: 1, name: /tech recruiting timeline/i })
      ).toBeInViewport();
      await expect(page.getByRole("main").getByTestId("lesson-content")).toContainText(
        "Sample lesson content for tests."
      );
      await scrollLessonToEnd(page);
      await expect(visibleNextLink(page)).toBeInViewport({ ratio: 1 });
      await expectSingleLessonScroller(page);
    });

    test("list markers and text fit within the content card", async ({ page }, testInfo) => {
      await page.goto(roadmapPath);
      // Next can retain an unrendered streaming copy outside the active main.
      // Counting its list items does not mean they have measurable text bounds.
      const content = lessonContent(page);
      await expect(content).toBeVisible();
      await expect(content.locator("ol > li")).toHaveCount(8);
      const lists = await content.locator("ul, ol").evaluateAll((elements) =>
        elements.map((list) => {
          const item = list.querySelector("li")!;
          const style = getComputedStyle(item);
          const range = document.createRange();
          range.selectNodeContents(item);
          const textLeft = range.getClientRects()[0].left;
          const listLeft = list.getBoundingClientRect().left;
          const contentRect = list.closest(".lesson-content")!.getBoundingClientRect();
          // Reserve room for an outside marker plus separation, scaled with text size.
          return {
            markerGutter: textLeft - listLeft,
            minimumGutter: parseFloat(style.fontSize) * 1.5,
            left: listLeft,
            right: list.getBoundingClientRect().right,
            contentLeft: contentRect.left,
            contentRight: contentRect.right,
          };
        })
      );
      expect(lists.length).toBeGreaterThan(1);
      for (const list of lists) {
        expect(list.markerGutter).toBeGreaterThanOrEqual(list.minimumGutter);
        expect(list.left).toBeGreaterThanOrEqual(list.contentLeft);
        expect(list.right).toBeLessThanOrEqual(list.contentRight + 1);
      }
      await content.locator("ol").scrollIntoViewIfNeeded();
      await expectSingleLessonScroller(page);
      await page.screenshot({ path: testInfo.outputPath("lesson-lists.png") });
    });
  });
}

test("Next and navigator remain reachable after mobile viewport changes", async ({
  page,
  isMobile,
  hasTouch,
}) => {
  test.skip(!isMobile, "Exercises iPhone viewport changes.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(roadmapPath);
  await expect(lessonContent(page)).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigator", exact: true })).toBeVisible();
  await expect(visibleNextLink(page)).toBeAttached();
  const initialViewport = page.viewportSize()!;
  const viewports = [
    { width: initialViewport.width, height: initialViewport.height - 160 },
    initialViewport,
    { width: initialViewport.height, height: initialViewport.width },
    initialViewport,
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    // WebKit can acknowledge the resize before the body's 100dvh height updates.
    // Wait for the lesson shell to match both shrinking and growing viewports.
    await expect
      .poll(
        () =>
          page.evaluate(() => ({
            width: document.documentElement.clientWidth,
            height: document.body.clientHeight,
          })),
        { timeout: 5_000, message: "Lesson shell matches the resized viewport" }
      )
      .toEqual(viewport);
    await scrollLessonToEnd(page);
  }
  await page.getByRole("button", { name: "Open navigator", exact: true }).tap();
  const navigator = page.getByRole("complementary", { name: "Lesson navigator" });
  await expect(navigator).toBeInViewport({ ratio: 1 });
  await navigator.getByRole("button", { name: "Close navigator" }).tap();
  await expect(page.locator("#lesson-navigator")).toHaveAttribute("aria-hidden", "true");
  await expect(page.locator("#lesson-navigator")).toBeHidden();
  await expect(page.locator("#lesson-navigator")).toHaveAttribute("inert", "");
  await expectSingleLessonScroller(page);
  await activateVisibleLink(page, visibleNextLink(page), hasTouch);
  await expect(page).toHaveURL(/\/lesson\/tech-recruiting-timeline/);
});
