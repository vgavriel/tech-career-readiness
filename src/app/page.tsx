import Link from "next/link";
import { getServerSession } from "next-auth";

import FocusPicker from "@/components/focus-picker";
import SignInCta from "@/components/sign-in-cta";
import { authOptions } from "@/lib/auth";
import { getLessonExample } from "@/lib/lesson-examples";

/**
 * Renders the marketing landing page with the primary CTAs and highlights.
 *
 * @remarks
 * Provides a concise entry point for new visitors; no state or side effects.
 */
export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const lessonExample = getLessonExample("start-to-finish-roadmap");
  const outcomes = lessonExample?.outcomes ?? [
    "Pick the focus that matches your urgency.",
    "Sequence the next three lessons.",
    "Turn the plan into weekly action.",
  ];
  const stats = [
    { label: "9 modules", value: "Brown-built sequence" },
    { label: "Core-first", value: "Extra credit optional" },
    { label: "15-30 min", value: "Short, scoped reads" },
  ];

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <main className="page-content mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-16 md:pt-24 lg:gap-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6 animate-rise">
            <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--accent-500)] bg-[color:var(--wash-0)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--ink-800)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--accent-700)]" />
              Brown student tech recruiting roadmap
            </div>
            <h1 className="font-display text-4xl leading-[1.08] text-[color:var(--ink-900)] md:text-5xl lg:text-6xl">
              Land your first tech role with a focused, Brown-built plan.
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
              Follow a clear sequence: positioning, portfolio, outreach,
              interviews, and offers. Each lesson is short, scoped, and mapped
              to real recruiting milestones.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/roadmap"
                className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--accent-700)] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)] sm:w-auto"
              >
                Start the roadmap
              </Link>
              {!isAuthenticated ? (
                <SignInCta className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-900)] transition hover:-translate-y-0.5 hover:border-[color:var(--ink-800)] hover:bg-[color:var(--accent-500)] sm:w-auto">
                  Save progress
                </SignInCta>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--ink-500)]">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-2"
                >
                  <span className="text-[color:var(--ink-700)]">
                    {item.label}
                  </span>{" "}
                  <span className="text-[color:var(--ink-500)]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="max-w-2xl text-xs text-[color:var(--ink-500)]">
              All lessons are open.{" "}
              {isAuthenticated
                ? "Progress syncs to your account."
                : "Sign in only when you want progress saved."}
            </p>
          </div>

          <div className="relative animate-rise-delayed">
            <div className="absolute -top-12 right-8 h-28 w-28 rounded-full bg-[color:var(--accent-500)] opacity-30 blur-2xl" />
            <div className="rounded-[30px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-7 shadow-[var(--shadow-lift)] md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--ink-500)]">
                  Start here
                </p>
                <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-900)]">
                  Module 1
                </span>
              </div>
              <h2 className="font-display mt-5 text-2xl text-[color:var(--ink-900)] md:text-3xl">
                {lessonExample?.title ?? "Start to Finish Roadmap"}
              </h2>
              <p className="mt-3 text-sm text-[color:var(--ink-700)] md:text-base">
                {lessonExample?.summary ??
                  "See the recruiting sequence end-to-end and pick a focus."}
              </p>
              <div className="mt-6 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                  Outcomes
                </p>
                <ul className="mt-3 grid gap-2.5 text-sm text-[color:var(--ink-700)]">
                  {outcomes.slice(0, 3).map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-700)]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                <span>{lessonExample?.estimatedMinutes ?? 25} min read</span>
                <Link
                  href={`/lesson/${lessonExample?.slug ?? "start-to-finish-roadmap"}`}
                  className="text-[color:var(--accent-700)]"
                >
                  Open lesson
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FocusPicker className="animate-rise" />
      </main>
    </div>
  );
}
