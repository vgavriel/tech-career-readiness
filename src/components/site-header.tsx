"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

/**
 * Render the persistent site header with auth actions.
 *
 * @remarks
 * Surfaces navigation branding and triggers auth flows based on session state;
 * no local state.
 */
export default function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line-soft)] border-t-4 border-t-[color:var(--accent-500)] bg-[rgba(255,250,244,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-[0.02em] text-[color:var(--ink-800)]"
          >
            Tech Career Readiness
          </Link>
          <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--ink-900)]">
            Open access
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/roadmap"
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-500)] transition hover:text-[color:var(--ink-900)]"
          >
            Roadmap
          </Link>
          {session?.user ? (
            <>
              <span className="text-[color:var(--ink-700)]">
                {session.user.name ?? session.user.email}
              </span>
              <button
                className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:border-[color:var(--ink-900)]"
                onClick={() => signOut()}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              className="rounded-full bg-[color:var(--accent-700)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)]"
              onClick={() => signIn("google")}
              type="button"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
