import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LessonAnalytics, { LessonLoadReport } from "@/components/lesson-analytics";
import { captureAnalytics } from "@/lib/__tests__/fixtures/capture-analytics";
import { resetAnalyticsForTests } from "@/lib/analytics";

describe("LessonAnalytics", () => {
  let capture: ReturnType<typeof captureAnalytics>;

  beforeEach(() => {
    resetAnalyticsForTests();
    capture = captureAnalytics();
  });

  afterEach(() => {
    capture.stop();
    vi.restoreAllMocks();
  });

  /** Render lessons with a fresh module, as on a new page, and the given navigation entry. */
  const renderFreshLessons = async (documentUrl: string, slugs: string[]) => {
    vi.resetModules();
    vi.spyOn(performance, "getEntriesByType").mockReturnValue([
      { name: documentUrl } as PerformanceEntry,
    ]);
    const fresh = await import("@/components/lesson-analytics");
    const view = (slug: string) => (
      <fresh.default key={slug} lessonSlug={slug} lessonTitle={slug}>
        <fresh.LessonLoadReport dataSource="built_in" />
      </fresh.default>
    );
    const { rerender } = render(view(slugs[0]));
    for (const slug of slugs.slice(1)) {
      rerender(view(slug));
    }
    await waitFor(() => expect(capture.named("lesson_load")).toHaveLength(slugs.length));
    return capture.named("lesson_load").map((event) => event.params.navigation_type);
  };

  const renderLesson = () =>
    render(
      <LessonAnalytics lessonSlug="learn-about-backend-engineering" lessonTitle="Backend">
        <a href="https://www.linkedin.com/jobs" target="_blank" rel="noreferrer">
          <span>LinkedIn jobs</span>
        </a>
        <a href="#h.section">Section</a>
        <LessonLoadReport dataSource="live" />
      </LessonAnalytics>
    );

  it("sends lesson_view and lesson_load once when the lesson renders", async () => {
    renderLesson();

    await waitFor(() => expect(capture.named("lesson_load")).toHaveLength(1));
    expect(capture.named("lesson_view")).toEqual([
      {
        event: "lesson_view",
        params: expect.objectContaining({
          lesson_slug: "learn-about-backend-engineering",
          career_field: "Backend Engineering",
        }),
      },
    ]);
    expect(capture.named("lesson_load")[0].params).toEqual({
      lesson_slug: "learn-about-backend-engineering",
      data_source: "live",
      navigation_type: expect.stringMatching(/^(page_load|in_app)$/),
      load_time_ms: expect.any(Number),
    });
  });

  it("times the lesson the browser loaded directly as page_load, later ones as in_app", async () => {
    expect(await renderFreshLessons(window.location.href, ["first", "second"])).toEqual([
      "page_load",
      "in_app",
    ]);
  });

  it("times a lesson reached from another page as in_app", async () => {
    expect(await renderFreshLessons("http://localhost/privacy", ["first"])).toEqual(["in_app"]);
  });

  it("reports clicks and middle clicks on links inside the lesson", async () => {
    renderLesson();
    const link = screen.getByText("LinkedIn jobs");

    await userEvent.click(link);
    fireEvent(link, new MouseEvent("auxclick", { bubbles: true, button: 1 }));
    fireEvent(link, new MouseEvent("auxclick", { bubbles: true, button: 2 }));
    await userEvent.click(screen.getByText("Section"));

    const clicks = capture.named("external_link_click");
    expect(clicks).toHaveLength(2);
    expect(clicks[0].params).toMatchObject({
      link_url: "https://www.linkedin.com/jobs",
      link_domain: "linkedin.com",
      link_text: "LinkedIn jobs",
      lesson_slug: "learn-about-backend-engineering",
    });
    expect(capture.events.map((event) => event.event)).not.toContain("resource_click");
  });

  it("does not report lesson_load outside a lesson", () => {
    render(<LessonLoadReport dataSource="none" />);

    expect(capture.events).toEqual([]);
  });
});
