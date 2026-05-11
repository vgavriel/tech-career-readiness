import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const contentMocks = vi.hoisted(() => ({
  fetchLessonContent: vi.fn(),
}));

const docLinkMapMocks = vi.hoisted(() => ({
  getLessonDocLinkMap: vi.fn(),
  rewriteLessonDocLinks: vi.fn((html: string) => html),
}));

const lessonExampleMocks = vi.hoisted(() => ({
  getLessonExample: vi.fn(),
}));

const lessonSlugMocks = vi.hoisted(() => ({
  buildLessonRedirectPath: vi.fn((slug: string) => `/lesson/${slug}`),
  findLessonBySlug: vi.fn(),
}));

const navMocks = vi.hoisted(() => ({
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
}));

const roadmapMocks = vi.hoisted(() => ({
  getRoadmapModules: vi.fn(),
}));

const staticContentMocks = vi.hoisted(() => ({
  getStaticLessonContent: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  notFound: () => navMocks.notFound(),
  permanentRedirect: (...args: [string]) => navMocks.permanentRedirect(...args),
}));

vi.mock("@/components/lesson-content", () => ({
  default: ({ html }: { html: string }) => <div data-testid="lesson-content">{html}</div>,
}));

vi.mock("@/components/lesson-navigator", () => ({
  default: ({ currentLessonSlug }: { currentLessonSlug: string }) => (
    <nav data-testid="lesson-navigator">{currentLessonSlug}</nav>
  ),
}));

vi.mock("@/components/lesson-next-core-cta", () => ({
  default: ({ currentLessonSlug }: { currentLessonSlug: string }) => (
    <div data-testid="next-core-cta">{currentLessonSlug}</div>
  ),
}));

vi.mock("@/components/lesson-progress-toggle", () => ({
  default: ({ lessonSlug }: { lessonSlug: string }) => (
    <button type="button">Toggle {lessonSlug}</button>
  ),
}));

vi.mock("@/components/navigator-layout", () => ({
  default: ({ navigator, children }: { navigator: ReactNode; children: ReactNode }) => (
    <div>
      {navigator}
      <main>{children}</main>
    </div>
  ),
}));

vi.mock("@/lib/lesson-content", () => ({
  fetchLessonContent: contentMocks.fetchLessonContent,
}));

vi.mock("@/lib/lesson-doc-link-map", () => ({
  getLessonDocLinkMap: docLinkMapMocks.getLessonDocLinkMap,
}));

vi.mock("@/lib/lesson-doc-links", () => ({
  rewriteLessonDocLinks: docLinkMapMocks.rewriteLessonDocLinks,
}));

vi.mock("@/lib/lesson-examples", () => ({
  getLessonExample: lessonExampleMocks.getLessonExample,
}));

vi.mock("@/lib/lesson-slug", () => ({
  buildLessonRedirectPath: lessonSlugMocks.buildLessonRedirectPath,
  findLessonBySlug: lessonSlugMocks.findLessonBySlug,
}));

vi.mock("@/lib/lesson-static-content", () => ({
  getStaticLessonContent: staticContentMocks.getStaticLessonContent,
}));

vi.mock("@/lib/roadmap-modules", () => ({
  getRoadmapModules: roadmapMocks.getRoadmapModules,
}));

type LessonMock = {
  id: string;
  slug: string;
  title: string;
  order: number;
  estimatedMinutes: number | null;
  publishedUrl: string;
  isArchived: boolean;
  supersededBy: {
    id: string;
    slug: string;
    title: string;
    order: number;
    isArchived: boolean;
    module: {
      title: string;
      order: number;
    };
  } | null;
  module: {
    key: string;
    order: number;
  };
};

const publishedResumeUrl =
  "https://docs.google.com/document/d/e/2PACX-1vSjS8d_YwKSSR9h_S1DyVoyZZh1wZr8z5qoqnY7vazFiJhzv2VUGx0toRq9d0D4cs549ODZEGSzyF2V/pub";
const resumeGoogleDocUrl =
  "https://docs.google.com/document/d/1eP7sJtgJxT0i9vR7bsSfQY3wFb7_5ewCOcscenBLkyQ/";

const makeLesson = (overrides: Partial<LessonMock> = {}): LessonMock => ({
  id: "lesson-tech-resume",
  slug: "tech-resume-example",
  title: "Tech Resume Example with Annotations",
  order: 2,
  estimatedMinutes: 3,
  publishedUrl: publishedResumeUrl,
  isArchived: false,
  supersededBy: null,
  module: {
    key: "applications",
    order: 6,
  },
  ...overrides,
});

const renderLessonPage = async (
  slug: string,
  searchParams: Record<string, string | string[] | undefined> = {}
) => {
  const LessonPage = (await import("@/app/lesson/[slug]/page")).default;
  const ui = await LessonPage({
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve(searchParams),
  });

  render(ui);
};

describe("Lesson page", () => {
  beforeEach(() => {
    contentMocks.fetchLessonContent.mockReset();
    docLinkMapMocks.getLessonDocLinkMap.mockReset();
    docLinkMapMocks.rewriteLessonDocLinks.mockReset();
    lessonExampleMocks.getLessonExample.mockReset();
    lessonSlugMocks.buildLessonRedirectPath.mockClear();
    lessonSlugMocks.findLessonBySlug.mockReset();
    navMocks.notFound.mockReset();
    navMocks.permanentRedirect.mockReset();
    roadmapMocks.getRoadmapModules.mockReset();
    staticContentMocks.getStaticLessonContent.mockReset();

    docLinkMapMocks.getLessonDocLinkMap.mockResolvedValue(new Map());
    docLinkMapMocks.rewriteLessonDocLinks.mockImplementation((html: string) => html);
    lessonExampleMocks.getLessonExample.mockReturnValue(null);
    roadmapMocks.getRoadmapModules.mockResolvedValue([]);
    staticContentMocks.getStaticLessonContent.mockReturnValue(null);
  });

  it("shows the original Google Doc link instead of rendering the resume annotation content", async () => {
    lessonSlugMocks.findLessonBySlug.mockResolvedValue({
      lesson: makeLesson(),
      isAlias: false,
    });

    await renderLessonPage("tech-resume-example");

    expect(contentMocks.fetchLessonContent).not.toHaveBeenCalled();
    expect(screen.queryByTestId("lesson-content")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /open this lesson in google docs/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not render accurately in the course reader/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open google doc/i })).toHaveAttribute(
      "href",
      resumeGoogleDocUrl
    );
  });

  it("continues fetching and rendering content for other lessons", async () => {
    lessonSlugMocks.findLessonBySlug.mockResolvedValue({
      lesson: makeLesson({
        id: "lesson-other",
        slug: "craft-winning-tech-applications",
        title: "Craft Winning Tech Job and Internship Applications",
        order: 1,
        publishedUrl: "https://docs.google.com/document/d/e/lesson-other/pub",
      }),
      isAlias: false,
    });
    contentMocks.fetchLessonContent.mockResolvedValue({
      lessonId: "lesson-other",
      html: "<p>Fetched lesson content</p>",
      cached: false,
    });

    await renderLessonPage("craft-winning-tech-applications");

    expect(contentMocks.fetchLessonContent).toHaveBeenCalledWith(
      {
        id: "lesson-other",
        publishedUrl: "https://docs.google.com/document/d/e/lesson-other/pub",
      },
      { docIdMap: expect.any(Map) }
    );
    expect(screen.getByTestId("lesson-content")).toHaveTextContent("Fetched lesson content");
    expect(screen.queryByRole("link", { name: /open google doc/i })).not.toBeInTheDocument();
  });

  it("renders static lesson content and rewrites internal doc links", async () => {
    lessonSlugMocks.findLessonBySlug.mockResolvedValue({
      lesson: makeLesson({
        id: "lesson-static",
        slug: "static-lesson",
        title: "Static Lesson",
        estimatedMinutes: null,
        publishedUrl: "https://docs.google.com/document/d/e/static-lesson/pub",
      }),
      isAlias: false,
    });
    staticContentMocks.getStaticLessonContent.mockReturnValue({
      slug: "static-lesson",
      estimatedMinutes: 8,
      contentHtml: "<p>Static lesson content</p>",
    });
    docLinkMapMocks.rewriteLessonDocLinks.mockReturnValue("<p>Rewritten static content</p>");

    await renderLessonPage("static-lesson");

    expect(contentMocks.fetchLessonContent).not.toHaveBeenCalled();
    expect(docLinkMapMocks.rewriteLessonDocLinks).toHaveBeenCalledWith(
      "<p>Static lesson content</p>",
      expect.any(Map)
    );
    expect(screen.getByText(/8 min estimated reading time/i)).toBeInTheDocument();
    expect(screen.getByTestId("lesson-content")).toHaveTextContent("Rewritten static content");
  });

  it("shows example content with a fallback notice when fetching fails", async () => {
    lessonSlugMocks.findLessonBySlug.mockResolvedValue({
      lesson: makeLesson({
        id: "lesson-fallback",
        slug: "fallback-lesson",
        title: "Fallback Lesson",
        estimatedMinutes: null,
        publishedUrl: "https://docs.google.com/document/d/e/fallback-lesson/pub",
      }),
      isAlias: false,
    });
    lessonExampleMocks.getLessonExample.mockReturnValue({
      estimatedMinutes: 6,
      contentHtml: "<p>Example fallback content</p>",
    });
    contentMocks.fetchLessonContent.mockRejectedValue(new Error("Fetch failed"));

    await renderLessonPage("fallback-lesson");

    expect(screen.getByText(/live document is still syncing/i)).toBeInTheDocument();
    expect(screen.getByText(/6 min estimated reading time/i)).toBeInTheDocument();
    expect(screen.getByTestId("lesson-content")).toHaveTextContent("Example fallback content");
  });

  it("shows an unavailable message when fetching fails without fallback content", async () => {
    const publishedUrl = "https://docs.google.com/document/d/e/unavailable-lesson/pub";
    lessonSlugMocks.findLessonBySlug.mockResolvedValue({
      lesson: makeLesson({
        id: "lesson-unavailable",
        slug: "unavailable-lesson",
        title: "Unavailable Lesson",
        publishedUrl,
      }),
      isAlias: false,
    });
    contentMocks.fetchLessonContent.mockRejectedValue(new Error("Fetch failed"));

    await renderLessonPage("unavailable-lesson");

    expect(screen.queryByTestId("lesson-content")).not.toBeInTheDocument();
    expect(screen.getByText(/lesson content is unavailable right now/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /try again/i })).toHaveAttribute(
      "href",
      "/lesson/unavailable-lesson"
    );
    expect(screen.getByRole("link", { name: /open the source doc/i })).toHaveAttribute(
      "href",
      publishedUrl
    );
  });
});
