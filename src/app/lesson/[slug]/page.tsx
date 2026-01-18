import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import LessonContent from "@/components/lesson-content";
import LessonNavigator from "@/components/lesson-navigator";
import NavigatorLayout from "@/components/navigator-layout";
import { getLessonExample } from "@/lib/lesson-examples";
import { fetchLessonContent } from "@/lib/lesson-content";
import { buildLessonRedirectPath, findLessonBySlug } from "@/lib/lesson-slug";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Route params supplied by the App Router.
 */
type LessonPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Parse the objectives markdown list into clean bullet strings.
 */
const parseObjectives = (objectivesMarkdown: string | null) =>
  (objectivesMarkdown ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

/**
 * Render the lesson page with content, objectives, and progress actions.
 *
 * @remarks
 * Fetches lesson data/content on the server and handles content errors while
 * composing navigation and progress UI.
 */
export default async function LessonPage({
  params,
  searchParams,
}: LessonPageProps) {
  const { slug } = await params;
  const rawSearchParams = searchParams ? await searchParams : undefined;
  const { lesson, isAlias } = await findLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  if (lesson.isArchived) {
    if (lesson.supersededBy && !lesson.supersededBy.isArchived) {
      permanentRedirect(
        buildLessonRedirectPath(lesson.supersededBy.slug, rawSearchParams)
      );
    }

    notFound();
  }

  if (isAlias) {
    permanentRedirect(buildLessonRedirectPath(lesson.slug, rawSearchParams));
  }

  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      key: true,
      title: true,
      description: true,
      order: true,
      lessons: {
        where: { isArchived: false },
        orderBy: { order: "asc" },
        select: {
          id: true,
          key: true,
          slug: true,
          title: true,
          order: true,
          estimatedMinutes: true,
        },
      },
    },
  });

  const lessonExample = getLessonExample(lesson.slug);
  const objectives = lessonExample?.outcomes.length
    ? lessonExample.outcomes
    : parseObjectives(lesson.objectivesMarkdown);
  const checklist = lessonExample?.checklist ?? [];
  const estimatedMinutes =
    lesson.estimatedMinutes ?? lessonExample?.estimatedMinutes;
  const lessonSummary =
    lessonExample?.summary ??
    (lesson.module?.title
      ? `Part of ${lesson.module.title}, focused on the next step in your recruiting system.`
      : "A focused lesson designed to keep your recruiting system moving.");

  let lessonContent: Awaited<ReturnType<typeof fetchLessonContent>> | null = null;
  let contentError = false;

  try {
    lessonContent = await fetchLessonContent({
      id: lesson.id,
      publishedUrl: lesson.publishedUrl,
    });
  } catch {
    contentError = true;
  }

  const fallbackHtml = contentError ? lessonExample?.contentHtml ?? null : null;
  const contentHtml = lessonContent?.html ?? fallbackHtml;
  const showFallbackNotice = Boolean(contentError && fallbackHtml);
  const showErrorState = Boolean(contentError && !fallbackHtml);

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <NavigatorLayout
        navigator={
          <LessonNavigator
            modules={modules}
            currentLessonKey={lesson.key}
            currentLessonSlug={lesson.slug}
            currentModuleKey={lesson.module?.key ?? null}
          />
        }
      >
        <div className="space-y-8">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--ink-500)]">
            <Link href="/" className="transition hover:text-[color:var(--ink-900)]">
              Course
            </Link>
            <span>/</span>
            <span>
              Module {lesson.module?.order ?? "?"}:{lesson.module?.title
                ? ` ${lesson.module.title}`
                : ""}
            </span>
          </nav>

          <header className="rounded-[24px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-7 shadow-[var(--shadow-card)] md:p-9">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-700)]">
              <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-3 py-1.5 text-[color:var(--ink-900)]">
                Module {lesson.module?.order ?? "?"}
              </span>
              <span className="rounded-full border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] px-3 py-1.5 text-[color:var(--ink-900)]">
                Lesson {lesson.order}
              </span>
              {estimatedMinutes ? (
                <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-1.5 text-[color:var(--ink-700)]">
                  {estimatedMinutes} min read
                </span>
              ) : null}
            </div>
            <h1 className="font-display mt-5 text-3xl text-[color:var(--ink-900)] md:text-4xl lg:text-5xl">
              {lesson.title}
            </h1>
            <p className="mt-3 text-sm text-[color:var(--ink-700)] md:text-base">
              {lessonSummary}
            </p>

            {lessonExample ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                    Focus
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                    {lessonExample.focus}
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                    Deliverable
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                    {lessonExample.deliverable}
                  </p>
                </div>
              </div>
            ) : null}
          </header>

          {objectives.length || checklist.length ? (
            <div className="rounded-[24px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-7 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Lesson plan
              </p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                {objectives.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                      Outcomes
                    </p>
                    <ul className="mt-3 grid gap-3 text-sm text-[color:var(--ink-700)]">
                      {objectives.map((objective) => (
                        <li key={objective} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[color:var(--accent-700)]" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {checklist.length ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                      Checklist
                    </p>
                    <ul className="mt-3 grid gap-2 text-sm text-[color:var(--ink-700)]">
                      {checklist.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-700)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <section className="rounded-[24px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-7 shadow-[var(--shadow-card)] md:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Lesson content
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {lesson.publishedUrl ? (
                  <a
                    href={lesson.publishedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--accent-700)]"
                  >
                    Open source doc
                  </a>
                ) : null}
                {contentError ? (
                  <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-900)]">
                    Syncing docs
                  </span>
                ) : null}
              </div>
            </div>
            {showFallbackNotice ? (
              <div className="mt-4 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-5 text-sm text-[color:var(--ink-700)]">
                The live document is still syncing. Showing a full sample lesson
                below in the meantime.
              </div>
            ) : null}
            {showErrorState ? (
              <div className="mt-4 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-5 text-sm text-[color:var(--ink-700)]">
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
                  rel="noreferrer"
                  className="font-semibold text-[color:var(--accent-700)] underline"
                >
                  open the source doc
                </a>
                .
              </div>
            ) : null}
            {contentHtml ? (
              <div className="mt-7">
                <LessonContent html={contentHtml} />
              </div>
            ) : null}
          </section>

          {lessonExample?.plan.length ? (
            <div className="rounded-[24px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Action plan
              </p>
              <div className="mt-4 grid gap-3 text-sm text-[color:var(--ink-700)]">
                {lessonExample.plan.map((step) => (
                  <div key={step.title} className="space-y-1">
                    <p className="font-semibold text-[color:var(--ink-900)]">
                      {step.title}
                    </p>
                    <p>{step.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </NavigatorLayout>
    </div>
  );
}
