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
      <main
        id="main-content"
        tabIndex={-1}
        className="page-content mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-20 pt-12 md:pt-16"
      >
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-5">
            <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl">
              Explore Brown-specific tech roles.
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
              Short deep dives with Brown alumni links and course-to-role
              context. These are extra credit and do not affect core progress.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href={`/lesson/${startLessonSlug}`}
                className="no-underline inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-5 py-2.5 text-xs font-semibold text-[color:var(--ink-900)] transition hover:border-[color:var(--ink-800)] sm:w-auto"
              >
                Back to course
              </Link>
            </div>
          </div>
          <div className="rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
            <p className="text-sm text-[color:var(--ink-700)]">
              Pick 2-3 roles, scan for skills and Brown-specific signals, then
              use the insights to refine your focus.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="mt-2 font-display text-2xl text-[color:var(--ink-900)] md:text-3xl">
              Role deep dives
            </h2>
          </div>
          <RoleLibraryList lessons={orderedLessons} />
        </section>
      </main>
    </div>
  );
}
