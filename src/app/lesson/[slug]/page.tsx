import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import LessonContent from "@/components/lesson-content";
import LessonProgressCard from "@/components/lesson-progress-card";
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

  if (isAlias) {
    permanentRedirect(buildLessonRedirectPath(lesson.slug, rawSearchParams));
  }

  const [previousLesson, nextLesson] = await Promise.all([
    prisma.lesson.findFirst({
      where: {
        moduleId: lesson.moduleId,
        order: { lt: lesson.order },
      },
      orderBy: { order: "desc" },
      select: { slug: true, title: true, order: true },
    }),
    prisma.lesson.findFirst({
      where: {
        moduleId: lesson.moduleId,
        order: { gt: lesson.order },
      },
      orderBy: { order: "asc" },
      select: { slug: true, title: true, order: true },
    }),
  ]);

  const objectives = parseObjectives(lesson.objectivesMarkdown);
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed,_#f7f1e8_55%,_#f0e1cf_100%)]">
      <div className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-[color:var(--wash-200)] opacity-70 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-72 w-72 rounded-full bg-[color:var(--accent-500)] opacity-10 blur-[120px]" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-24 pt-14 md:pt-20">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
          <Link href="/roadmap" className="transition hover:text-[color:var(--ink-900)]">
            Roadmap
          </Link>
          <span>/</span>
          <span>
            Module {lesson.module?.order ?? "?"}:{lesson.module?.title
              ? ` ${lesson.module.title}`
              : ""}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
              <span>Lesson {lesson.order}</span>
              {lesson.estimatedMinutes ? (
                <span>{lesson.estimatedMinutes} min read</span>
              ) : null}
            </div>
            <h1 className="font-display mt-4 text-3xl text-[color:var(--ink-900)] md:text-4xl">
              {lesson.title}
            </h1>

            {objectives.length ? (
              <div className="mt-6 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-100)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                  Lesson objectives
                </p>
                <ul className="mt-3 grid gap-2 text-sm text-[color:var(--ink-700)]">
                  {objectives.map((objective) => (
                    <li key={objective} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[color:var(--accent-500)]" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-8 border-t border-[color:var(--line-soft)] pt-8">
              {contentError ? (
                <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-100)] p-4 text-sm text-[color:var(--ink-700)]">
                  Lesson content is unavailable right now. Please check back in a
                  moment.
                </div>
              ) : lessonContent ? (
                <LessonContent html={lessonContent.html} />
              ) : null}
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <LessonProgressCard lessonId={lesson.id} lessonTitle={lesson.title} />
            <div className="rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Resources
              </p>
              <a
                href={lesson.publishedUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent-700)]"
              >
                Open source doc
              </a>
            </div>

            <div className="rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Navigate
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-semibold">
                {previousLesson ? (
                  <Link
                    href={`/lesson/${previousLesson.slug}`}
                    className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-100)] px-4 py-3 text-[color:var(--ink-900)] transition hover:border-[color:var(--ink-900)]"
                  >
                    ← Lesson {previousLesson.order}: {previousLesson.title}
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[color:var(--line-soft)] px-4 py-3 text-xs uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                    You are at the first lesson
                  </div>
                )}
                {nextLesson ? (
                  <Link
                    href={`/lesson/${nextLesson.slug}`}
                    className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-100)] px-4 py-3 text-[color:var(--ink-900)] transition hover:border-[color:var(--ink-900)]"
                  >
                    Lesson {nextLesson.order}: {nextLesson.title} →
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[color:var(--line-soft)] px-4 py-3 text-xs uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                    End of module
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
