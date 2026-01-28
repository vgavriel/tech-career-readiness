"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import FocusMenu from "@/components/focus-menu";
import { buildSignInOptions, useAuthProvider } from "@/hooks/use-auth-provider";

/**
 * Render the persistent site header with auth actions.
 *
 * @remarks
 * Surfaces navigation branding and triggers auth flows based on session state;
 * no local state.
 */
type SiteHeaderInnerProps = {
  pathname: string;
};

function SiteHeaderInner({ pathname }: SiteHeaderInnerProps) {
  const { data: session } = useSession();
  const { provider: authProvider, isReady } = useAuthProvider();
  const signInOptions = buildSignInOptions(authProvider.id);
  const showFocusMenu = pathname !== "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current?.contains(target) || toggleRef.current?.contains(target)) {
        return;
      }
      setIsMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--line-soft)] bg-[color:var(--wash-0)] shadow-[var(--shadow-soft)]">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-3 sm:px-5 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="no-underline inline-flex min-h-11 max-w-[65vw] items-center truncate font-display text-base font-semibold text-[color:var(--ink-900)] sm:max-w-none sm:text-lg md:text-xl"
            >
              Tech Career Readiness
            </Link>
            <nav
              aria-label="Primary"
              className="hidden items-center gap-3 text-sm text-[color:var(--ink-600)] lg:flex"
            >
              <Link
                href="/gold-stars"
                className="inline-flex min-h-11 items-center whitespace-nowrap transition hover:text-[color:var(--ink-900)]"
              >
                Gold Stars
              </Link>
              <Link
                href="/roles"
                className="inline-flex min-h-11 items-center whitespace-nowrap transition hover:text-[color:var(--ink-900)]"
              >
                Explore Tech Roles
              </Link>
              <a
                href="https://github.com/vgavriel/tech-career-readiness"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center whitespace-nowrap transition hover:text-[color:var(--ink-900)]"
              >
                About
              </a>
              <Link
                href="/privacy"
                className="inline-flex min-h-11 items-center whitespace-nowrap transition hover:text-[color:var(--ink-900)]"
              >
                Privacy Policy
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-3 text-sm lg:flex">
              {showFocusMenu ? <FocusMenu /> : null}
              {session?.user ? (
                <>
                  <span className="text-sm text-[color:var(--ink-600)] whitespace-nowrap">
                    Signed in as: {session.user.name ?? session.user.email}
                  </span>
                  <button
                    className="min-h-11 whitespace-nowrap rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 text-sm font-semibold text-[color:var(--ink-800)] transition hover:border-[color:var(--ink-900)]"
                    onClick={() => signOut()}
                    type="button"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <button
                    className="min-h-11 whitespace-nowrap rounded-full bg-[color:var(--accent-700)] px-4 text-xs font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => signIn(authProvider.id, signInOptions)}
                    type="button"
                    disabled={!isReady}
                    aria-busy={!isReady}
                  >
                    {authProvider.label}
                  </button>
                  <p className="text-[10px] leading-snug text-[color:var(--ink-500)] text-right">
                    By signing in, you agree to our{" "}
                    <Link href="/privacy" className="underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-3 text-sm font-semibold text-[color:var(--ink-800)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--ink-900)] md:min-h-11 md:px-4 md:text-base lg:hidden"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu-panel"
            >
              Menu
              <svg
                aria-hidden="true"
                className={`h-3.5 w-3.5 transition ${isMenuOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen ? (
          <div
            ref={menuRef}
            id="mobile-menu-panel"
            className="mt-3 grid max-h-[70vh] gap-4 overflow-y-auto rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] p-4 shadow-[var(--shadow-card)] md:gap-5 md:p-5 lg:hidden"
          >
            <nav aria-label="Primary" className="grid gap-2 text-sm">
              <Link
                href="/gold-stars"
                className="inline-flex items-center justify-between rounded-xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-2 font-semibold text-[color:var(--ink-800)] transition hover:border-[color:var(--ink-900)] whitespace-nowrap"
              >
                Gold Stars
              </Link>
              <Link
                href="/roles"
                className="inline-flex items-center justify-between rounded-xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-2 font-semibold text-[color:var(--ink-800)] transition hover:border-[color:var(--ink-900)] whitespace-nowrap"
              >
                Explore Tech Roles
              </Link>
              <a
                href="https://github.com/vgavriel/tech-career-readiness"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-between rounded-xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-2 font-semibold text-[color:var(--ink-800)] transition hover:border-[color:var(--ink-900)] whitespace-nowrap"
              >
                About
              </a>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-between rounded-xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-2 font-semibold text-[color:var(--ink-800)] transition hover:border-[color:var(--ink-900)] whitespace-nowrap"
              >
                Privacy Policy
              </Link>
            </nav>
            {showFocusMenu ? (
              <div className="grid gap-3 border-t border-[color:var(--line-soft)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)] whitespace-nowrap">
                  Focus
                </p>
                <FocusMenu inlinePanel />
              </div>
            ) : null}
            <div className="grid gap-3 border-t border-[color:var(--line-soft)] pt-4 text-sm">
              {session?.user ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-[color:var(--ink-600)] whitespace-nowrap truncate max-w-[55vw]">
                    Signed in as: {session.user.name ?? session.user.email}
                  </span>
                  <button
                    className="min-h-10 whitespace-nowrap rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 text-sm font-semibold text-[color:var(--ink-800)] transition hover:border-[color:var(--ink-900)]"
                    onClick={() => signOut()}
                    type="button"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <button
                    className="min-h-10 w-full whitespace-nowrap rounded-full bg-[color:var(--accent-700)] px-4 text-sm font-semibold text-[color:var(--wash-0)] shadow-[var(--shadow-soft)] transition hover:bg-[color:var(--ink-800)] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => signIn(authProvider.id, signInOptions)}
                    type="button"
                    disabled={!isReady}
                    aria-busy={!isReady}
                  >
                    {authProvider.label}
                  </button>
                  <p className="text-[11px] leading-snug text-[color:var(--ink-500)]">
                    By signing in, you agree to our{" "}
                    <Link href="/privacy" className="underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  return <SiteHeaderInner key={pathname} pathname={pathname} />;
}
