import NavigatorLayout from "@/components/navigator-layout";

const skeletonBlockClass = "animate-pulse rounded-full bg-[color:var(--wash-200)]/80";

/**
 * Render immediate feedback while a lesson route streams from the server.
 *
 * @remarks
 * Cold starts and lesson-content cache misses can delay the dynamic lesson
 * response. This route-level loading state keeps navigation visibly active.
 */
export default function LessonLoading() {
  return (
    <div
      className="page-shell h-full overflow-hidden"
      aria-busy="true"
      aria-live="polite"
      data-testid="lesson-loading"
    >
      <NavigatorLayout
        navigator={
          <div className="flex h-full flex-col gap-4 p-4">
            <div className="space-y-2">
              <div className={`${skeletonBlockClass} h-3 w-28`} />
              <div className={`${skeletonBlockClass} h-8 w-full rounded-xl`} />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className={`${skeletonBlockClass} h-10 rounded-xl ${
                    index % 3 === 0 ? "w-11/12" : "w-full"
                  }`}
                />
              ))}
            </div>
          </div>
        }
      >
        <div className="relative flex min-h-full flex-col gap-6 pb-6">
          <div className="space-y-6">
            <header className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`${skeletonBlockClass} h-7 w-24`} />
                  <div className={`${skeletonBlockClass} h-7 w-24`} />
                  <div className={`${skeletonBlockClass} h-7 w-44`} />
                </div>
                <div className={`${skeletonBlockClass} h-10 w-36`} />
              </div>
              <div className="mt-5 space-y-3">
                <div className={`${skeletonBlockClass} h-10 w-10/12 rounded-xl md:h-12`} />
                <div className={`${skeletonBlockClass} h-10 w-7/12 rounded-xl md:h-12`} />
              </div>
            </header>

            <section className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6">
              <div
                className="flex items-center gap-3 rounded-xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-4 py-3 text-sm font-semibold text-[color:var(--ink-700)]"
                role="status"
              >
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[color:var(--line-soft)] border-t-[color:var(--accent-700)]"
                />
                <span>Loading lesson content...</span>
              </div>

              <div className="mt-6 space-y-3">
                <div className={`${skeletonBlockClass} h-4 w-full`} />
                <div className={`${skeletonBlockClass} h-4 w-11/12`} />
                <div className={`${skeletonBlockClass} h-4 w-10/12`} />
                <div className={`${skeletonBlockClass} h-4 w-full`} />
                <div className={`${skeletonBlockClass} h-4 w-8/12`} />
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-[color:var(--line-soft)]">
                <div className="h-12 animate-pulse bg-[color:var(--wash-200)]/70" />
                <div className="grid grid-cols-1 divide-y divide-[color:var(--line-soft)] md:grid-cols-2 md:divide-x md:divide-y-0">
                  <div className="space-y-3 p-4">
                    <div className={`${skeletonBlockClass} h-4 w-7/12`} />
                    <div className={`${skeletonBlockClass} h-4 w-full`} />
                    <div className={`${skeletonBlockClass} h-4 w-10/12`} />
                    <div className={`${skeletonBlockClass} h-4 w-9/12`} />
                  </div>
                  <div className="space-y-3 p-4">
                    <div className={`${skeletonBlockClass} h-4 w-8/12`} />
                    <div className={`${skeletonBlockClass} h-4 w-full`} />
                    <div className={`${skeletonBlockClass} h-4 w-11/12`} />
                    <div className={`${skeletonBlockClass} h-4 w-7/12`} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </NavigatorLayout>
    </div>
  );
}
