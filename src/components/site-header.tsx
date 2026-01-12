"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line-soft)] bg-[rgba(255,255,255,0.9)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-baseline gap-4">
          <Link href="/" className="text-lg font-semibold text-[color:var(--ink-900)]">
            Tech Career Readiness
          </Link>
          <span className="text-xs text-[color:var(--ink-500)]">
            Explore freely. Sign in to sync progress.
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <span className="text-[color:var(--ink-700)]">
                {session.user.name ?? session.user.email}
              </span>
              <button
                className="rounded-full border border-[color:var(--line-soft)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:border-[color:var(--ink-900)]"
                onClick={() => signOut()}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              className="rounded-full bg-[color:var(--ink-900)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--wash-0)] transition hover:-translate-y-0.5"
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
