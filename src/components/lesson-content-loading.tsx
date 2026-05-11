const skeletonBlockClass = "animate-pulse rounded-full bg-[color:var(--wash-200)]/80";

const paragraphSkeletonRows = [
  { id: "row-1", width: "w-full" },
  { id: "row-2", width: "w-11/12" },
  { id: "row-3", width: "w-10/12" },
  { id: "row-4", width: "w-full" },
  { id: "row-5", width: "w-8/12" },
] as const;

const tableLeftRows = [
  { id: "left-heading", width: "w-7/12" },
  { id: "left-1", width: "w-full" },
  { id: "left-2", width: "w-10/12" },
  { id: "left-3", width: "w-9/12" },
] as const;

const tableRightRows = [
  { id: "right-heading", width: "w-8/12" },
  { id: "right-1", width: "w-full" },
  { id: "right-2", width: "w-11/12" },
  { id: "right-3", width: "w-7/12" },
] as const;

/**
 * Render a loading state for only the lesson content card body.
 *
 * @remarks
 * Used inside the lesson page Suspense boundary so the navigator and lesson
 * header stay visible while slow published content is fetched and sanitized.
 */
export default function LessonContentLoading() {
  return (
    <div aria-busy="true" aria-live="polite" data-testid="lesson-content-loading">
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
        {paragraphSkeletonRows.map((row) => (
          <div key={row.id} className={`${skeletonBlockClass} h-4 ${row.width}`} />
        ))}
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[color:var(--line-soft)]">
        <div className="h-12 animate-pulse bg-[color:var(--wash-200)]/70" />
        <div className="grid grid-cols-1 divide-y divide-[color:var(--line-soft)] md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="space-y-3 p-4">
            {tableLeftRows.map((row) => (
              <div key={row.id} className={`${skeletonBlockClass} h-4 ${row.width}`} />
            ))}
          </div>
          <div className="space-y-3 p-4">
            {tableRightRows.map((row) => (
              <div key={row.id} className={`${skeletonBlockClass} h-4 ${row.width}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
