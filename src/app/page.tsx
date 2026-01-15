import Link from "next/link";

import SignInCta from "@/components/sign-in-cta";

/**
 * Renders the marketing landing page with the primary CTAs and highlights.
 *
 * @remarks
 * Provides a concise entry point for new visitors; no state or side effects.
 */
export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed,_#f7f1e8_55%,_#f2e7d6_100%)]">
      <div className="pointer-events-none absolute -top-32 right-[-8rem] h-72 w-72 rounded-full bg-[color:var(--wash-200)] opacity-70 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] h-72 w-72 rounded-full bg-[color:var(--accent-500)] opacity-15 blur-[120px]" />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 md:pt-24">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8 animate-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--ink-500)]">
              Self-paced tech recruiting roadmap
            </p>
            <h1 className="font-display text-4xl text-[color:var(--ink-900)] md:text-5xl lg:text-6xl">
              A clear, structured path from student to hired engineer.
            </h1>
            <p className="max-w-2xl text-base text-[color:var(--ink-700)] md:text-lg">
              Learn the sequence that actually works: portfolio foundations,
              interview readiness, networking, and offer negotiations. Every
              lesson is focused, short, and mapped to real milestones.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/roadmap"
                className="rounded-full bg-[color:var(--ink-900)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-black"
              >
                View the roadmap
              </Link>
              <SignInCta
                className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:-translate-y-0.5 hover:border-[color:var(--ink-900)]"
              >
                Sign in to save progress
              </SignInCta>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "7 modules", value: "Built for clarity" },
                { label: "Short lessons", value: "15-30 min reads" },
                { label: "Actionable", value: "Practice every week" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-4 text-sm shadow-[var(--shadow-soft)]"
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
          <div className="relative rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-soft)] animate-rise-delayed">
            <div className="absolute -top-4 right-6 rounded-full bg-[color:var(--wash-200)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-700)]">
              Roadmap preview
            </div>
            <div className="space-y-4 pt-6">
              {[
                {
                  title: "Positioning and story",
                  items: ["Career narrative", "Target roles", "Signals of fit"],
                },
                {
                  title: "Portfolio + projects",
                  items: ["Project scoping", "Write-ups", "Live demos"],
                },
                {
                  title: "Interview readiness",
                  items: ["Behavioral prep", "LeetCode strategy", "Mock loops"],
                },
              ].map((module) => (
                <div
                  key={module.title}
                  className="rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-100)] p-4"
                >
                  <p className="text-sm font-semibold text-[color:var(--ink-900)]">
                    {module.title}
                  </p>
                  <ul className="mt-3 grid gap-2 text-xs uppercase tracking-[0.22em] text-[color:var(--ink-500)]">
                    {module.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-500)]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-4 text-xs uppercase tracking-[0.28em] text-[color:var(--ink-500)]">
              Continue where you left off once signed in.
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1fr_1fr]">
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
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-3xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-soft)]"
            >
              <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
                {step.title}
              </h2>
              <p className="mt-3 text-sm text-[color:var(--ink-700)] md:text-base">
                {step.description}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
