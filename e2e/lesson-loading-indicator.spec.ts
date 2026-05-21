import { expect, type Locator, type Page, test } from "@playwright/test";

const sourceLessonSlug = "start-to-finish-roadmap";
const targetLessonSlug = "tech-recruiting-timeline";

const mockLessonContent = /sample lesson content for tests/i;
const navigationOverlayTestId = "lesson-navigation-loading";

const lessonUrlPattern = (slug: string) => new RegExp(`/lesson/${slug}(?:\\?.*)?$`);

const lessonNavigator = (page: Page) =>
  page.getByRole("complementary", { name: /lesson navigator/i });

const lessonLink = (page: Page, slugTitle: RegExp): Locator =>
  lessonNavigator(page).getByRole("link", { name: slugTitle });

test.describe("lesson loading indicators", () => {
  test("cached lesson navigation settles without a stuck overlay", async ({ page }) => {
    await page.goto(`/lesson/${targetLessonSlug}`);
    await expect(page.getByRole("heading", { name: /tech recruiting timeline/i })).toBeVisible();
    await expect(page.getByText(mockLessonContent)).toBeVisible();

    await page.goto(`/lesson/${sourceLessonSlug}`);
    await expect(page.getByRole("heading", { name: /start to finish/i })).toBeVisible();
    await expect(page.getByTestId(navigationOverlayTestId)).toBeHidden();
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");

    await Promise.all([
      page.waitForURL(lessonUrlPattern(targetLessonSlug)),
      lessonLink(page, /tech recruiting timeline/i).click(),
    ]);

    await expect(page.getByRole("heading", { name: /tech recruiting timeline/i })).toBeVisible();
    await expect(page.getByText(mockLessonContent)).toBeVisible();
    await expect(page.getByTestId(navigationOverlayTestId)).toBeHidden();
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");

    await Promise.all([
      page.waitForURL(lessonUrlPattern(sourceLessonSlug)),
      lessonLink(page, /start to finish/i).click(),
    ]);

    await expect(page.getByRole("heading", { name: /start to finish/i })).toBeVisible();
    await expect(page.getByText(/welcome to the roadmap/i)).toBeVisible();
    await expect(page.getByTestId(navigationOverlayTestId)).toBeHidden();
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
  });

  test("slow lesson navigation shows and clears the overlay deterministically", async ({
    page,
  }) => {
    let releaseNavigation!: () => void;
    let resolveTargetRequest!: () => void;
    let isNavigationReleased = false;
    const targetRequestSeen = new Promise<void>((resolve) => {
      resolveTargetRequest = resolve;
    });
    const navigationGate = new Promise<void>((resolve) => {
      releaseNavigation = () => {
        if (!isNavigationReleased) {
          isNavigationReleased = true;
          resolve();
        }
      };
    });

    await page.route(`**/lesson/${targetLessonSlug}**`, async (route) => {
      resolveTargetRequest();
      await navigationGate;
      await route.continue();
    });

    await page.goto(`/lesson/${sourceLessonSlug}`);
    await expect(page.getByRole("heading", { name: /start to finish/i })).toBeVisible();

    const overlay = page.getByTestId(navigationOverlayTestId);
    const targetClick = lessonLink(page, /tech recruiting timeline/i).click();

    try {
      await targetRequestSeen;
      await expect(page).toHaveURL(lessonUrlPattern(sourceLessonSlug));
      await expect(overlay).toBeVisible();
      await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "true");
      await expect(overlay.getByRole("status")).toContainText(/loading lesson/i);

      releaseNavigation();
      await targetClick;

      await expect(page).toHaveURL(lessonUrlPattern(targetLessonSlug));
      await expect(page.getByRole("heading", { name: /tech recruiting timeline/i })).toBeVisible();
      await expect(page.getByText(mockLessonContent)).toBeVisible();
      await expect(overlay).toBeHidden();
      await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
    } finally {
      releaseNavigation();
    }
  });
});
