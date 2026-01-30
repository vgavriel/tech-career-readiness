import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import LessonContent from "@/components/lesson-content";
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
  const estimatedMinutes =
    lesson.estimatedMinutes ?? staticLesson?.estimatedMinutes ?? lessonExample?.estimatedMinutes;
  let contentHtml = staticLesson?.contentHtml ?? null;
  let contentSource: "static" | "fetch" | "example" | null = contentHtml ? "static" : null;
  let showFallbackNotice = false;
  let showErrorState = false;

  if (!contentHtml) {
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
    <div className="page-shell h-full overflow-hidden">
      <NavigatorLayout
        navigator={
          <LessonNavigator
            modules={modules}
            currentLessonSlug={lesson.slug}
            currentModuleKey={lesson.module?.key ?? null}
          />
        }
      >
        <div className="relative flex min-h-full flex-col gap-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
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
              {showFallbackNotice ? (
                <div className="mt-3 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-3 text-sm text-[color:var(--ink-700)]">
                  The live document is still syncing. Showing a full sample lesson below in the
                  meantime.
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
            </section>
          </div>
          <LessonNextCoreCta modules={modules} currentLessonSlug={lesson.slug} />
        </div>
      </NavigatorLayout>
    </div>
  );
}
