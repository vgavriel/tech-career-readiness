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

const visibleNavigationOverlay = (page: Page): Locator =>
  page.getByTestId(navigationOverlayTestId).filter({ visible: true });

const expectNavigatorReady = async (page: Page) => {
  // Completion controls enable after the navigator's client state has hydrated.
  await expect(
    lessonNavigator(page).getByRole("button", { name: /mark start to finish.*complete/i })
  ).toBeEnabled();
};

const trackDocumentNavigations = (page: Page) => {
  const navigations: string[] = [];
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      navigations.push(request.url());
    }
  });
  return navigations;
};

test.describe("lesson loading indicators", () => {
  test("cached lesson navigation settles without a stuck overlay", async ({ page }) => {
    await page.goto(`/lesson/${sourceLessonSlug}`);
    await expect(page.getByRole("heading", { name: /start to finish/i })).toBeVisible();
    await expectNavigatorReady(page);
    await expect(visibleNavigationOverlay(page)).toHaveCount(0);
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");

    const documentNavigations = trackDocumentNavigations(page);
    // Warm and revisit both routes through client navigation so the router cache
    // survives. A page.goto() between visits would discard that cache.
    await Promise.all([
      page.waitForURL(lessonUrlPattern(targetLessonSlug)),
      lessonLink(page, /tech recruiting timeline/i).click(),
    ]);

    await expect(page.getByRole("heading", { name: /tech recruiting timeline/i })).toBeVisible();
    await expect(page.getByText(mockLessonContent)).toBeVisible();
    await expect(visibleNavigationOverlay(page)).toHaveCount(0);
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");

    await Promise.all([
      page.waitForURL(lessonUrlPattern(sourceLessonSlug)),
      lessonLink(page, /start to finish/i).click(),
    ]);

    await expect(page.getByRole("heading", { name: /start to finish/i })).toBeVisible();
    await expect(page.getByText(/welcome to the roadmap/i)).toBeVisible();
    await expect(visibleNavigationOverlay(page)).toHaveCount(0);
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");

    await Promise.all([
      page.waitForURL(lessonUrlPattern(targetLessonSlug)),
      lessonLink(page, /tech recruiting timeline/i).click(),
    ]);

    await expect(page.getByRole("heading", { name: /tech recruiting timeline/i })).toBeVisible();
    await expect(page.getByText(mockLessonContent)).toBeVisible();
    await expect(visibleNavigationOverlay(page)).toHaveCount(0);
    await expect(page.getByRole("main")).toHaveAttribute("aria-busy", "false");
    expect(documentNavigations).toEqual([]);
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

    // Install before loading the source so production prefetches are also held
    // and cannot satisfy the click from cache before we inspect the overlay.
    await page.route(
      (url) => url.pathname === `/lesson/${targetLessonSlug}`,
      async (route) => {
        resolveTargetRequest();
        await navigationGate;
        await route.continue();
      }
    );

    await page.goto(`/lesson/${sourceLessonSlug}`);
    await expect(page.getByRole("heading", { name: /start to finish/i })).toBeVisible();
    await expectNavigatorReady(page);

    const documentNavigations = trackDocumentNavigations(page);

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
      expect(documentNavigations).toEqual([]);
    } finally {
      releaseNavigation();
    }
  });
});
