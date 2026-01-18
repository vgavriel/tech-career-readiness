import Link from "next/link";

import RoleLibraryList from "@/components/role-library-list";
import { ROLE_DEEP_DIVE_LESSON_SLUGS } from "@/lib/lesson-classification";
import { getLessonExample } from "@/lib/lesson-examples";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Render the role library with all role deep dives.
 *
 * @remarks
 * Pulls curated role deep dives from the lesson catalog and preserves ordering.
 */
export default async function RolesPage() {
  const startLessonSlug =
    getLessonExample("start-to-finish-roadmap")?.slug ??
    "start-to-finish-roadmap";

  const lessons = await prisma.lesson.findMany({
    where: {
      slug: { in: ROLE_DEEP_DIVE_LESSON_SLUGS },
      isArchived: false,
    },
    select: {
      id: true,
      key: true,
      slug: true,
      title: true,
    },
  });

  const lessonsBySlug = new Map(lessons.map((lesson) => [lesson.slug, lesson]));
  const orderedLessons = ROLE_DEEP_DIVE_LESSON_SLUGS.flatMap((slug) => {
    const lesson = lessonsBySlug.get(slug);
    return lesson ? [lesson] : [];
  });

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <main className="page-content mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-16 md:pt-22">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--accent-500)] bg-[color:var(--wash-0)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-800)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--accent-700)]" />
              Role library
            </div>
            <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl">
              Explore tech roles in depth.
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
              Brown-specific deep dives for when you want more context. These
              are extra credit and do not affect core progress.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/lesson/${startLessonSlug}`}
                className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:-translate-y-0.5 hover:border-[color:var(--ink-800)] hover:bg-[color:var(--accent-500)] sm:w-auto"
              >
                Back to course
              </Link>
            </div>
          </div>
          <div className="rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-6 shadow-[var(--shadow-card)] md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
              Quick use
            </p>
            <ul className="mt-4 grid gap-3 text-sm text-[color:var(--ink-700)]">
              {[
                "Pick 2-3 roles to explore.",
                "Scan for skills and Brown-specific signals.",
                "Use findings to refine your focus and applications.",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-700)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
              All roles
            </p>
            <h2 className="mt-2 font-display text-2xl text-[color:var(--ink-900)] md:text-3xl">
              Brown-specific role deep dives
            </h2>
          </div>
          <RoleLibraryList lessons={orderedLessons} />
        </section>
      </main>
    </div>
  );
}
