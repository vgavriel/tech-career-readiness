import { notFound, redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Format timestamps for the admin analytics UI.
 */
const formatTimestamp = (value: Date) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

/**
 * Render the admin analytics dashboard for usage and progress.
 *
 * @remarks
 * Gates access by auth/admin checks and surfaces server-fetched aggregates;
 * triggers redirects/notFound when unauthorized.
 */
export default async function AdminAnalyticsPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/api/auth/signin/google");
  }

  if (!user.isAdmin) {
    notFound();
  }

  const [totalLessons, users] = await Promise.all([
    prisma.lesson.count({ where: { isArchived: false } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        progress: {
          where: { completedAt: { not: null }, lesson: { isArchived: false } },
          select: { lessonId: true },
        },
        events: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            action: true,
            createdAt: true,
            lesson: {
              select: {
                title: true,
                slug: true,
                order: true,
                isArchived: true,
                supersededBy: {
                  select: {
                    title: true,
                    slug: true,
                    order: true,
                    module: {
                      select: {
                        title: true,
                        order: true,
                      },
                    },
                  },
                },
                module: {
                  select: {
                    title: true,
                    order: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const totalUsers = users.length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed,_#f7f1e8_55%,_#f0e1cf_100%)]">
      <div className="pointer-events-none absolute -top-24 right-[-6rem] h-72 w-72 rounded-full bg-[color:var(--wash-200)] opacity-70 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-72 w-72 rounded-full bg-[color:var(--accent-500)] opacity-10 blur-[120px]" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-24 pt-14 md:pt-20">
        <section className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--ink-500)]">
            Admin analytics
          </p>
          <h1 className="font-display text-3xl text-[color:var(--ink-900)] md:text-4xl">
            Usage, progress, and timelines
          </h1>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Total users
              </p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--ink-900)]">
                {totalUsers}
              </p>
            </div>
            <div className="rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Total lessons
              </p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--ink-900)]">
                {totalLessons}
              </p>
            </div>
            <div className="rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Admin
              </p>
              <p className="mt-3 text-base font-semibold text-[color:var(--ink-900)]">
                {user.name ?? user.email}
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
            Learner progress
          </h2>

          {users.length === 0 ? (
            <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 text-sm text-[color:var(--ink-700)] shadow-[var(--shadow-soft)]">
              No learners yet.
            </div>
          ) : (
            <div className="space-y-6">
              {users.map((learner) => {
                const completedCount = new Set(
                  learner.progress.map((entry) => entry.lessonId)
                ).size;
                const progressPercent = totalLessons
                  ? Math.round((completedCount / totalLessons) * 100)
                  : 0;
                const progressValue = Math.min(100, Math.max(0, progressPercent));

                return (
                  <div
                    key={learner.id}
                    className="rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-soft)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                          {learner.name ?? "Unnamed user"}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                          {learner.email}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--ink-500)]">
                          Joined {formatTimestamp(learner.createdAt)}
                        </p>
                      </div>
                      <div className="flex min-w-[200px] flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
                          <span>Progress</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full">
                          <svg
                            className="h-2 w-full"
                            viewBox="0 0 100 8"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="0"
                              y="0"
                              width="100"
                              height="8"
                              rx="4"
                              fill="var(--wash-200)"
                            />
                            <rect
                              x="0"
                              y="0"
                              width={progressValue}
                              height="8"
                              rx="4"
                              fill="var(--accent-500)"
                            />
                          </svg>
                        </div>
                        <p className="text-xs text-[color:var(--ink-500)]">
                          {completedCount} of {totalLessons} lessons complete
                        </p>
                      </div>
                    </div>

                    <details className="mt-6 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-100)] p-4">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
                        Progress timeline ({learner.events.length})
                      </summary>
                      <div className="mt-4 grid gap-3">
                        {learner.events.length === 0 ? (
                          <p className="text-sm text-[color:var(--ink-600)]">
                            No activity yet.
                          </p>
                        ) : (
                          learner.events.map((event) => {
                            const supersededBy = event.lesson.supersededBy;
                            const supersededLabel = supersededBy
                              ? `Superseded by Module ${supersededBy.module.order}.${supersededBy.order} - ${supersededBy.title}`
                              : null;
                            const statusLabel = event.lesson.isArchived
                              ? ["Archived", supersededLabel]
                                  .filter(Boolean)
                                  .join(" • ")
                              : supersededLabel;

                            return (
                              <div
                                key={event.id}
                                className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] px-4 py-3 text-sm text-[color:var(--ink-700)]"
                              >
                                <p className="font-semibold text-[color:var(--ink-900)]">
                                  {event.action === "completed"
                                    ? "Completed"
                                    : "Marked incomplete"}{" "}
                                  - Module {event.lesson.module.order}.
                                  {event.lesson.order} - {event.lesson.title}
                                </p>
                                {statusLabel ? (
                                  <p className="mt-1 text-xs text-[color:var(--ink-500)]">
                                    {statusLabel}
                                  </p>
                                ) : null}
                                <p className="mt-1 text-xs text-[color:var(--ink-500)]">
                                  {formatTimestamp(event.createdAt)}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
