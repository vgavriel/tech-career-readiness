import { expect, type Page, test } from "@playwright/test";

const lessons = [
  { slug: "job-titles-to-cs-courses", id: "h.xbc98wpe6ddt", link: "Front-End Engineer (jobs)" },
  { slug: "cs-courses-to-job-titles", id: "h.tvmayj7zoprj", link: "Front-End Engineer (courses)" },
];

/** Require the heading to land in the reader without moving the surrounding page. */
async function expectHeadingInReader(page: Page, id: string) {
  const heading = page.locator(`[id="${id}"]`);
  await expect(heading).toBeInViewport({ ratio: 1 });
  await expect
    .poll(() =>
      heading.evaluate((element) => {
        const main = element.closest("main")!;
        return Math.abs(element.getBoundingClientRect().top - main.getBoundingClientRect().top);
      })
    )
    .toBeLessThanOrEqual(17);
  expect(await page.getByRole("main").evaluate((main) => main.scrollTop)).toBeGreaterThan(500);
  expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0);
}

for (const lesson of lessons) {
  const path = `/lesson/${lesson.slug}`;
  const hash = `#heading=${lesson.id}`;

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

    await page.getByRole("link", { name: "Back to lesson sections", exact: true }).click();
    await expect(page).toHaveURL(`${path}#lesson-top`);
    await page.goBack();
    await expect(page).toHaveURL(`${path}${hash}`);
    await expectHeadingInReader(page, lesson.id);
    await page.goForward();
    await expect(page).toHaveURL(`${path}#lesson-top`);
    await expect(page.locator('[id="lesson-top"]')).toBeInViewport({ ratio: 1 });
  });

  test(`${lesson.slug}: saved deep link and reload`, async ({ page }) => {
    await page.goto(`${path}${hash}`);
    await expectHeadingInReader(page, lesson.id);
    await page.reload();
    await expectHeadingInReader(page, lesson.id);
  });
}

test("a reference to the other lesson opens its requested heading", async ({ page }) => {
  await page.goto(`/lesson/${lessons[0].slug}`);
  await page.getByRole("link", { name: lessons[1].link, exact: true }).click();
  await expect(page).toHaveURL(`/lesson/${lessons[1].slug}#heading=${lessons[1].id}`);
  await expectHeadingInReader(page, lessons[1].id);
});
