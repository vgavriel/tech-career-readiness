"use client";

import Link from "next/link";

import { FOCUS_OPTIONS, buildFocusHref } from "@/lib/focus-options";
import { writeFocusSelection } from "@/lib/focus-selection";

type FocusPickerProps = {
  className?: string;
};

export default function FocusPicker({ className }: FocusPickerProps) {
  return (
    <section
      className={`space-y-5 rounded-[28px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-6 shadow-[var(--shadow-card)] md:p-7 ${
        className ?? ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
            Quick focus
          </p>
          <h2 className="mt-2 font-display text-2xl text-[color:var(--ink-900)]">
            Where are you right now?
          </h2>
        </div>
        <Link
          href="/roles"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-600)] transition hover:text-[color:var(--accent-700)]"
        >
          Explore roles
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FOCUS_OPTIONS.map((option, index) => (
          <Link
            key={option.key}
            href={buildFocusHref(option.key)}
            onClick={() => writeFocusSelection(option.key)}
            className="group flex h-full flex-col justify-between rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-5 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] animate-fade"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--ink-500)]">
                <span>{option.label}</span>
                <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-2.5 py-1 text-[10px] tracking-[0.2em] text-[color:var(--ink-900)]">
                  {option.timing}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--ink-700)]">
                {option.description}
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-700)]">
              Start this focus
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
