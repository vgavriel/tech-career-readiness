"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-4">
          <Link href="/" className="text-lg font-semibold text-black">
            Tech Career Readiness
          </Link>
          <span className="text-xs text-black/60">
            Explore freely. Sign in to save progress across devices.
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <span className="text-black/70">
                {session.user.name ?? session.user.email}
              </span>
              <button
                className="rounded border border-black/20 px-3 py-1 text-black"
                onClick={() => signOut()}
                type="button"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              className="rounded bg-black px-3 py-1 text-white"
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
