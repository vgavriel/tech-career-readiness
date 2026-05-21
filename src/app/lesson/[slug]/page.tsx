import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { type ReactNode, Suspense, use } from "react";

import LessonContent from "@/components/lesson-content";
import LessonContentLoading from "@/components/lesson-content-loading";
import LessonNavigator from "@/components/lesson-navigator";
import LessonNextCoreCta from "@/components/lesson-next-core-cta";
import LessonProgressToggle from "@/components/lesson-progress-toggle";
import NavigatorLayout from "@/components/navigator-layout";
import { fetchLessonContent } from "@/lib/lesson-content";
import { getLessonDocLinkMap } from "@/lib/lesson-doc-link-map";
import { rewriteLessonDocLinks } from "@/lib/lesson-doc-links";
import { getLessonExample } from "@/lib/lesson-examples";
import { buildLessonRedirectPath, findLessonBySlug } from "@/lib/lesson-slug";
import { getStaticLessonContent } from "@/lib/lesson-static-content";
import { getRoadmapModules } from "@/lib/roadmap-modules";

/**
 * Route params supplied by the App Router.
 */
type LessonPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const GOOGLE_DOC_ONLY_LESSON_URLS = new Map([
  [
    "tech-resume-example",
    "https://docs.google.com/document/d/1eP7sJtgJxT0i9vR7bsSfQY3wFb7_5ewCOcscenBLkyQ/",
  ],
]);

const buildLessonRouteKey = (
  slug: string,
  rawSearchParams?: Record<string, string | string[] | undefined>
) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(rawSearchParams ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          searchParams.append(key, item);
        }
      }
      continue;
    }

    if (value !== undefined) {
      searchParams.set(key, value);
    }
  }

  const serializedSearchParams = searchParams.toString();
  return serializedSearchParams ? `/lesson/${slug}?${serializedSearchParams}` : `/lesson/${slug}`;
};

type BuildLessonContentPanelProps = {
  googleDocOnlyUrl: string | null;
  lesson: {
    id: string;
    publishedUrl: string;
    slug: string;
  };
  lessonDocLinkMap: Awaited<ReturnType<typeof getLessonDocLinkMap>>;
  lessonExample: ReturnType<typeof getLessonExample>;
  staticLesson: ReturnType<typeof getStaticLessonContent>;
};

type LessonContentPanelProps = {
  contentPromise: Promise<ReactNode>;
};

/**
 * Resolve the lesson content body inside the page content card.
 *
 * @remarks
 * This function intentionally owns the slow published-content fetch so the
 * page can stream the lesson frame while this panel shows a focused loading
 * state during cache misses.
 */
async function buildLessonContentPanel({
  googleDocOnlyUrl,
  lesson,
  lessonDocLinkMap,
  lessonExample,
  staticLesson,
}: BuildLessonContentPanelProps) {
  let contentHtml = googleDocOnlyUrl ? null : (staticLesson?.contentHtml ?? null);
  let contentSource: "static" | "fetch" | "example" | null = contentHtml ? "static" : null;
  let showFallbackNotice = false;
  let showErrorState = false;

  if (!contentHtml && !googleDocOnlyUrl) {
    let lessonContent: Awaited<ReturnType<typeof fetchLessonContent>> | null = null;
    let contentError = false;

    try {
      lessonContent = await fetchLessonContent(
        {
          id: lesson.id,
          publishedUrl: lesson.publishedUrl,
        },
        { docIdMap: lessonDocLinkMap }
      );
    } catch {
      contentError = true;
    }

    const fallbackHtml = contentError ? (lessonExample?.contentHtml ?? null) : null;
    contentHtml = lessonContent?.html ?? fallbackHtml;
    if (lessonContent?.html) {
      contentSource = "fetch";
    } else if (fallbackHtml) {
      contentSource = "example";
    } else {
      contentSource = null;
    }
    showFallbackNotice = Boolean(contentError && fallbackHtml);
    showErrorState = Boolean(contentError && !fallbackHtml);
  }
  if (contentHtml && contentSource !== "fetch") {
    contentHtml = rewriteLessonDocLinks(contentHtml, lessonDocLinkMap);
  }

  return (
    <>
      {googleDocOnlyUrl ? (
        <div className="space-y-4" data-testid="google-doc-only-notice">
          <div className="space-y-2">
            <h2 className="font-display text-2xl text-[color:var(--ink-900)] md:text-3xl">
              Open this lesson in Google Docs
            </h2>
            <p className="max-w-3xl text-md leading-7 text-[color:var(--ink-700)]">
              This annotated resume does not render accurately in the course reader. Use the
              original Google Doc for the full example and annotations.
            </p>
          </div>
          <a
            href={googleDocOnlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline inline-flex min-h-11 items-center justify-center rounded-full bg-[color:var(--accent-700)] px-4 py-2 text-sm font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)]"
          >
            Open Google Doc
          </a>
        </div>
      ) : null}
      {showFallbackNotice ? (
        <div className="mt-3 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-3 text-sm text-[color:var(--ink-700)]">
          The live document is still syncing. Showing a full sample lesson below in the meantime.
        </div>
      ) : null}
      {showErrorState ? (
        <div className="mt-3 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-3 text-sm text-[color:var(--ink-700)]">
          Lesson content is unavailable right now.{" "}
          <Link
            href={`/lesson/${lesson.slug}`}
            className="font-semibold text-[color:var(--accent-700)] underline"
          >
            Try again
          </Link>{" "}
          or{" "}
          <a
            href={lesson.publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[color:var(--accent-700)] underline"
          >
            open the source doc
          </a>
          .
        </div>
      ) : null}
      {contentHtml ? (
        <div className="mt-4">
          <LessonContent html={contentHtml} />
        </div>
      ) : null}
    </>
  );
}

/**
 * Suspend only the lesson content card body while content resolves.
 */
function LessonContentPanel({ contentPromise }: LessonContentPanelProps) {
  return use(contentPromise);
}

/**
 * Render the lesson page with content and progress actions.
 *
 * @remarks
 * Fetches lesson data/content on the server and handles content errors while
 * composing navigation and progress UI.
 */
export default async function LessonPage({ params, searchParams }: LessonPageProps) {
  const { slug } = await params;
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const { lesson, isAlias } = await findLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  if (lesson.isArchived) {
    if (lesson.supersededBy && !lesson.supersededBy.isArchived) {
      permanentRedirect(buildLessonRedirectPath(lesson.supersededBy.slug, rawSearchParams));
    }

    notFound();
  }

  if (isAlias) {
    permanentRedirect(buildLessonRedirectPath(lesson.slug, rawSearchParams));
  }

  const [modules, lessonDocLinkMap] = await Promise.all([
    getRoadmapModules(),
    getLessonDocLinkMap(),
  ]);

  const lessonExample = getLessonExample(lesson.slug);
  const staticLesson = getStaticLessonContent(lesson.slug);
  const googleDocOnlyUrl = GOOGLE_DOC_ONLY_LESSON_URLS.get(lesson.slug) ?? null;
  const estimatedMinutes =
    lesson.estimatedMinutes ?? staticLesson?.estimatedMinutes ?? lessonExample?.estimatedMinutes;
  const renderedLessonRouteKey = buildLessonRouteKey(lesson.slug, rawSearchParams);
  const contentPromise = buildLessonContentPanel({
    googleDocOnlyUrl,
    lesson: {
      id: lesson.id,
      publishedUrl: lesson.publishedUrl,
      slug: lesson.slug,
    },
    lessonDocLinkMap,
    lessonExample,
    staticLesson,
  });

  return (
    <div className="page-shell h-full overflow-hidden">
      <NavigatorLayout
        renderedLessonRouteKey={renderedLessonRouteKey}
        navigator={
          <LessonNavigator
            modules={modules}
            currentLessonSlug={lesson.slug}
            currentModuleKey={lesson.module?.key ?? null}
          />
        }
      >
        <div className="relative flex min-h-full flex-col gap-6 pb-6">
          <div className="space-y-6">
            <header className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[color:var(--ink-600)]">
                  <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-2.5 py-0.5 text-[color:var(--ink-700)]">
                    Module {lesson.module?.order ?? "?"}
                  </span>
                  <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-2.5 py-0.5 text-[color:var(--ink-700)]">
                    Lesson {lesson.order}
                  </span>
                  {estimatedMinutes ? (
                    <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-2.5 py-0.5 text-[color:var(--ink-700)]">
                      {estimatedMinutes} min estimated reading time
                    </span>
                  ) : null}
                </div>
                <LessonProgressToggle lessonSlug={lesson.slug} />
              </div>
              <h1 className="font-display mt-5 text-3xl text-[color:var(--ink-900)] md:text-4xl lg:text-5xl">
                {lesson.title}
              </h1>
            </header>

            <section className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
              <Suspense fallback={<LessonContentLoading />}>
                <LessonContentPanel contentPromise={contentPromise} />
              </Suspense>
            </section>
          </div>
          <LessonNextCoreCta modules={modules} currentLessonSlug={lesson.slug} />
        </div>
      </NavigatorLayout>
    </div>
  );
}
