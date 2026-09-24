import { expect, type Page, test } from "@playwright/test";

import { lessonHeadingFixtures, lessonSectionsFixture } from "./fixtures/lesson-heading-content";

const LESSON_CONTENT_TEST_ID = "lesson-content";
const STREAMED_LESSON_COPY_TEST_ID = "streamed-lesson-copy";
// The reader leaves a 16px inset; allow one pixel for border/rounding differences.
const MAX_HEADING_TOP_OFFSET_PX = 17;
const MIN_HEADING_SCROLL_DISTANCE_PX = 500;

/** Require the heading to land in the reader without moving the surrounding page. */
async function expectHeadingInReader(page: Page, id: string) {
  // Streamed HTML can retain hidden copies outside the active reader.
  const reader = page.getByRole("main");
  const heading = reader.locator(`[id="${id}"]`);
  await expect(heading).toBeInViewport({ ratio: 1 });
  await expect
    .poll(() =>
      heading.evaluate((element) => {
        const main = element.closest("main")!;
        return Math.abs(element.getBoundingClientRect().top - main.getBoundingClientRect().top);
      })
    )
    .toBeLessThanOrEqual(MAX_HEADING_TOP_OFFSET_PX);
  expect(await reader.evaluate((main) => main.scrollTop)).toBeGreaterThan(
    MIN_HEADING_SCROLL_DISTANCE_PX
  );
  expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0);
}

for (const lesson of Object.values(lessonHeadingFixtures)) {
  const path = `/lesson/${lesson.slug}`;
  const hash = `#heading=${lesson.id}`;
  const sectionsUrl = `${path}#${lessonSectionsFixture.id}`;

  test(`${lesson.slug}: click, repeat click, and browser history`, async ({ page, hasTouch }) => {
    await page.goto(path);
    const link = page.getByRole("link", { name: lesson.link, exact: true });
    await expect(link).toBeVisible();
    // Theme control availability confirms hydration before testing the delegated click.
    await expect(page.getByRole("button", { name: /switch to .* mode/i })).toBeEnabled();
    let documentNavigations = 0;
    page.on("request", (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame())
        documentNavigations++;
    });
    if (hasTouch) await link.tap();
    else {
      await link.focus();
      await expect(link).toBeFocused();
      await link.press("Enter");
    }
    await expect(page).toHaveURL(`${path}${hash}`);
    await expectHeadingInReader(page, lesson.id);

    // Move away while keeping the hash, then activate the same reference again.
    await page.getByRole("main").evaluate((main) => main.scrollTo(0, 0));
    if (hasTouch) await link.tap();
    else await link.click();
    await expectHeadingInReader(page, lesson.id);
    expect(documentNavigations).toBe(0);

    await page.getByRole("link", { name: lessonSectionsFixture.backLink, exact: true }).click();
    await expect(page).toHaveURL(sectionsUrl);
    await page.goBack();
    await expect(page).toHaveURL(`${path}${hash}`);
    await expectHeadingInReader(page, lesson.id);
    await page.goForward();
    await expect(page).toHaveURL(sectionsUrl);
    await expect(
      page.getByRole("main").locator(`[id="${lessonSectionsFixture.id}"]`)
    ).toBeInViewport({ ratio: 1 });
  });

  test(`${lesson.slug}: saved deep link and reload`, async ({ page }) => {
    await page.goto(`${path}${hash}`);
    await expectHeadingInReader(page, lesson.id);
    await page.reload();
    await expectHeadingInReader(page, lesson.id);
  });

  test(`${lesson.slug}: heading checks ignore hidden streamed copies`, async ({ page }) => {
    await page.goto(`${path}${hash}`);
    await expectHeadingInReader(page, lesson.id);

    // React can retain streamed content outside the reader in a hidden container.
    // Keep a duplicate present so this regression does not depend on stream timing.
    await page
      .getByRole("main")
      .getByTestId(LESSON_CONTENT_TEST_ID)
      .evaluate((content, streamedCopyTestId) => {
        const streamedCopy = document.createElement("div");
        streamedCopy.hidden = true;
        streamedCopy.dataset.testid = streamedCopyTestId;
        streamedCopy.append(content.cloneNode(true));
        document.body.append(streamedCopy);
      }, STREAMED_LESSON_COPY_TEST_ID);
    await expect(
      page.getByTestId(STREAMED_LESSON_COPY_TEST_ID).locator(`[id="${lesson.id}"]`)
    ).toHaveCount(1);
    await expectHeadingInReader(page, lesson.id);
    await page.getByRole("link", { name: lessonSectionsFixture.backLink, exact: true }).click();
    await expect(page).toHaveURL(sectionsUrl);
    await expect(
      page.getByRole("main").locator(`[id="${lessonSectionsFixture.id}"]`)
    ).toBeInViewport({ ratio: 1 });
  });
}

test("a reference to the other lesson opens its requested heading", async ({ page }) => {
  const { jobTitlesToCourses: source, coursesToJobTitles: destination } = lessonHeadingFixtures;
  await page.goto(`/lesson/${source.slug}`);
  await page.getByRole("link", { name: destination.link, exact: true }).click();
  await expect(page).toHaveURL(`/lesson/${destination.slug}#heading=${destination.id}`);
  await expectHeadingInReader(page, destination.id);
});
