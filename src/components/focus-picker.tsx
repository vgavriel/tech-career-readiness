"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useFocus } from "@/components/focus-provider";
import { FOCUS_OPTIONS, type FocusKey } from "@/lib/focus-options";

type FocusPickerProps = {
  className?: string;
  startHref?: string;
};

export default function FocusPicker({
  className,
  startHref = "/lesson/start-to-finish-roadmap",
}: FocusPickerProps) {
  const { setFocusKey } = useFocus();
  const router = useRouter();

  const handleSelect = (focusKey: FocusKey) => {
    void setFocusKey(focusKey);
    router.push(startHref);
  };

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
            Pick your focus.
          </h2>
          <p className="mt-2 text-sm text-[color:var(--ink-700)]">
            This trims the roadmap to what matters most today.
          </p>
        </div>
        <Link
          href="/roles"
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-900)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--ink-900)]"
        >
          Explore Brown role library
          <span className="text-[color:var(--ink-700)]">
            Extra credit deep dives
          </span>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FOCUS_OPTIONS.map((option, index) => (
          <button
            key={option.key}
            className="group flex h-full flex-col justify-between rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-5 text-left shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] animate-fade"
            style={{ animationDelay: `${index * 70}ms` }}
            onClick={() => handleSelect(option.key)}
            type="button"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-lg text-[color:var(--ink-900)]">
                  {option.label}
                </p>
                <span className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-900)]">
                  {option.timing}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--ink-700)]">
                {option.description}
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent-700)]">
              Apply this focus
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
