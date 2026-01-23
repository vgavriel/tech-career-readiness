"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const showFocusMenu = pathname !== "/";

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line-soft)] bg-[color:var(--wash-0)] shadow-[var(--shadow-soft)]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="no-underline inline-flex min-h-11 items-center font-display text-lg font-semibold text-[color:var(--ink-900)]"
            >
              Tech Career Readiness
            </Link>
          </div>
          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--ink-600)]"
          >
            <Link
              href="/gold-stars"
              className="inline-flex min-h-11 items-center transition hover:text-[color:var(--ink-900)]"
            >
              Gold Stars
            </Link>
            <Link
              href="/roles"
              className="inline-flex min-h-11 items-center transition hover:text-[color:var(--ink-900)]"
            >
              Explore Tech Roles
            </Link>
            <a
              href="https://github.com/vgavriel/tech-career-readiness"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center transition hover:text-[color:var(--ink-900)]"
            >
              About
            </a>
          </nav>
        </div>
        <div className="flex w-full flex-wrap items-center justify-between gap-3 text-sm sm:w-auto sm:justify-end">
          {showFocusMenu ? <FocusMenu /> : null}
          {session?.user ? (
            <>
              <span className="text-sm text-[color:var(--ink-600)]">
                {session.user.name ?? session.user.email}
              </span>
              <button
                className="min-h-11 rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 text-sm font-semibold text-[color:var(--ink-800)] transition hover:border-[color:var(--ink-900)]"
                onClick={() => signOut()}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              className="min-h-11 rounded-full bg-[color:var(--accent-700)] px-4 text-xs font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)]"
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
