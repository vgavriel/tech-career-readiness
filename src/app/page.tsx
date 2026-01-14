import Link from "next/link";

import SignInCta from "@/components/sign-in-cta";
import { getLessonExample } from "@/lib/lesson-examples";

/**
 * Renders the marketing landing page with the primary CTAs and highlights.
 *
 * @remarks
 * Provides a concise entry point for new visitors; no state or side effects.
 */
export default function Home() {
  const lessonExample = getLessonExample("define-your-goal");
  const checklist = lessonExample?.checklist.slice(0, 3) ?? [
    "Define your target role",
    "List constraints",
    "Set a weekly cadence",
  ];

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <main className="page-content mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 md:pt-24">
        <section className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8 animate-rise">
            <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--accent-500)] bg-[color:var(--wash-0)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--ink-800)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--accent-700)]" />
              Self-paced tech recruiting roadmap
            </div>
            <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl lg:text-6xl">
              Land your first tech role with a calm, structured plan.
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
              Learn the sequence that actually works: positioning, portfolio,
              interview readiness, and negotiation. Each lesson is focused,
              short, and mapped to real recruiting milestones.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/roadmap"
                className="rounded-full bg-[color:var(--accent-700)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)]"
              >
                View the roadmap
              </Link>
              <SignInCta
                className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:-translate-y-0.5 hover:border-[color:var(--ink-800)] hover:bg-[color:var(--accent-500)]"
              >
                Sign in to save progress
              </SignInCta>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "7 modules", value: "Built for clarity" },
                { label: "Short lessons", value: "15-30 min reads" },
                { label: "Actionable", value: "Practice every week" },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4 text-sm shadow-[var(--shadow-card)] animate-fade"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--ink-900)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-rise-delayed">
            <div className="absolute -top-10 right-6 h-24 w-24 rounded-full bg-[color:var(--accent-500)] opacity-30 blur-2xl" />
            <div className="rounded-[28px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-6 shadow-[var(--shadow-lift)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                  Lesson spotlight
                </p>
                <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-900)]">
                  Module 1
                </span>
              </div>
              <h2 className="font-display mt-4 text-2xl text-[color:var(--ink-900)]">
                {lessonExample?.title ?? "Define Your Goal"}
              </h2>
              <p className="mt-2 text-sm text-[color:var(--ink-700)]">
                {lessonExample?.summary ??
                  "Turn a vague search into a focused target role and weekly plan."}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                    Focus
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                    {lessonExample?.focus ??
                      "Clarify a target role and constraints."}
                  </p>
                </div>
                <div className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                    Deliverable
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--ink-900)]">
                    {lessonExample?.deliverable ??
                      "Goal sheet and weekly cadence."}
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-4">
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
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                <span>{lessonExample?.estimatedMinutes ?? 25} min read</span>
                <span>Actionable task</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Weekly cadence", value: "3-5 focused actions" },
                { label: "Progress tracking", value: "Saved when you sign in" },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-4 text-sm shadow-[var(--shadow-soft)] animate-fade"
                  style={{ animationDelay: `${120 + index * 90}ms` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--ink-900)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "Map the path",
              description:
                "Follow a sequenced curriculum that mirrors real recruiting timelines.",
            },
            {
              title: "Do the work",
              description:
                "Each lesson ends with a concrete task you can complete the same day.",
            },
            {
              title: "Track progress",
              description:
                "Sign in to save your spot, revisit lessons, and keep momentum.",
            },
          ].map((step, index) => (
            <div
              key={step.title}
              className="rounded-[28px] border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-card)] animate-fade"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] text-xs font-semibold text-[color:var(--ink-900)]">
                  0{index + 1}
                </span>
                <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
                  {step.title}
                </h2>
              </div>
              <p className="mt-3 text-sm text-[color:var(--ink-700)] md:text-base">
                {step.description}
              </p>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6 rounded-[28px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-6 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
              Open access
            </p>
            <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
              Read everything without signing in.
            </h2>
            <p className="text-sm text-[color:var(--ink-700)]">
              Sign in only if you want to sync progress across devices.
            </p>
          </div>
          <Link
            href="/roadmap"
            className="rounded-full bg-[color:var(--accent-700)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)]"
          >
            Explore the roadmap
          </Link>
        </section>
      </main>
    </div>
  );
}
