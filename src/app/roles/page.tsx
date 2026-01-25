import RoleLibraryList from "@/components/role-library-list";
import RolesBackToCourse from "@/components/roles-back-to-course";
import { ROLE_DEEP_DIVE_LESSON_SLUGS } from "@/lib/lesson-classification";
import { getRoadmapModules } from "@/lib/roadmap-modules";


/**
 * Render the role library with all role deep dives.
 *
 * @remarks
 * Pulls curated role deep dives from the lesson catalog and preserves ordering.
 */
export default async function RolesPage() {
  const modules = await getRoadmapModules();
  const lessonsBySlug = new Map(
    modules.flatMap((module) =>
      module.lessons.map((lesson) => [
        lesson.slug,
        { id: lesson.id, slug: lesson.slug, title: lesson.title },
      ])
    )
  );
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
              Short deep dives with links to find Brown alumni. These are extra credit and do not affect core progress.
            </p>
            <div className="flex flex-wrap gap-4">
              <RolesBackToCourse modules={modules} />
            </div>
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
