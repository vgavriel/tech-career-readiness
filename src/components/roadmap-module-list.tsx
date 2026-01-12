import Link from "next/link";

export type RoadmapLesson = {
  id: string;
  slug: string;
  title: string;
  order: number;
  estimatedMinutes: number | null;
};

export type RoadmapModule = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: RoadmapLesson[];
};

type RoadmapModuleListProps = {
  modules: RoadmapModule[];
};

export default function RoadmapModuleList({ modules }: RoadmapModuleListProps) {
  if (modules.length === 0) {
    return (
      <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--ink-700)] shadow-[var(--shadow-soft)]">
        Modules will appear here once the curriculum is loaded.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {modules.map((module) => (
        <section
          key={module.id}
          className="rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-soft)] md:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Module {module.order}
              </p>
              <h2 className="font-display text-2xl text-[color:var(--ink-900)] md:text-3xl">
                {module.title}
              </h2>
              {module.description ? (
                <p className="max-w-2xl text-sm text-[color:var(--ink-700)] md:text-base">
                  {module.description}
                </p>
              ) : null}
            </div>
            <div className="rounded-full bg-[color:var(--wash-200)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-700)]">
              {module.lessons.length} lessons
            </div>
          </div>

          <ol className="mt-6 grid gap-3">
            {module.lessons.map((lesson) => (
              <li
                key={lesson.id}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-transparent bg-[color:var(--wash-100)] px-4 py-3 transition hover:border-[color:var(--line-soft)] hover:bg-[color:var(--wash-0)]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[color:var(--ink-500)]">
                    {module.order}.{lesson.order}
                  </span>
                  <Link
                    href={`/lesson/${lesson.slug}`}
                    className="text-sm font-semibold text-[color:var(--ink-900)] transition group-hover:text-[color:var(--accent-700)] md:text-base"
                  >
                    {lesson.title}
                  </Link>
                </div>
                {lesson.estimatedMinutes ? (
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
                    {lesson.estimatedMinutes} min
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
