"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

import FocusMenu from "@/components/focus-menu";
import { buildSignInOptions, useAuthProvider } from "@/hooks/use-auth-provider";

/**
 * Render the persistent site header with auth actions.
 *
 * @remarks
 * Surfaces navigation branding and triggers auth flows based on session state;
 * no local state.
 */
export default function SiteHeader() {
  const { data: session } = useSession();
  const authProvider = useAuthProvider();
  const signInOptions = buildSignInOptions(authProvider.id);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line-soft)] border-t-4 border-t-[color:var(--accent-500)] bg-[rgba(255,250,244,0.92)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-5 py-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center font-display text-lg font-semibold tracking-[0.02em] text-[color:var(--ink-800)]"
          >
            Tech Career Readiness
          </Link>
          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-500)]"
          >
            <Link
              href="/badges"
              className="inline-flex min-h-11 items-center px-2 transition hover:text-[color:var(--ink-900)]"
            >
              Badges
            </Link>
            <a
              href="https://github.com/vgavriel/tech-career-readiness"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center px-2 transition hover:text-[color:var(--ink-900)]"
            >
              About
            </a>
          </nav>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 text-sm sm:w-auto sm:justify-end sm:gap-3">
          <FocusMenu />
          {session?.user ? (
            <>
              <span className="text-[color:var(--ink-700)]">
                {session.user.name ?? session.user.email}
              </span>
              <button
                className="rounded-lg border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:border-[color:var(--ink-900)] min-h-11"
                onClick={() => signOut()}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              className="rounded-lg bg-[color:var(--accent-700)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ink-800)] min-h-11"
              onClick={() => signIn(authProvider.id, signInOptions)}
              type="button"
            >
              {authProvider.label}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
