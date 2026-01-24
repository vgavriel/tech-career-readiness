"use client";

import { useId, type ChangeEvent } from "react";

import { useFocus } from "@/components/focus-provider";
import { FOCUS_OPTIONS, type FocusKey } from "@/lib/focus-options";

type FocusPickerProps = {
  className?: string;
};

export default function FocusPicker({ className }: FocusPickerProps) {
  const { focusKey, setFocusKey } = useFocus();
  const selectId = useId();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    void setFocusKey(value ? (value as FocusKey) : null);
  };

  return (
    <section
      className={`space-y-4 rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6 ${
        className ?? ""
      }`}
    >
      <div>
        <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
          Optional: choose a module.
        </h2>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <select
            id={selectId}
            value={focusKey ?? ""}
            onChange={handleChange}
            aria-label="Focus"
            className="min-h-11 w-full appearance-none rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-2.5 pr-11 text-[0.95rem] font-semibold text-[color:var(--ink-900)] shadow-[var(--shadow-soft)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
          >
            <option value="">
              Full roadmap: See every core lesson, in order.
            </option>
            {FOCUS_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}: {option.description}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-600)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  );
}
