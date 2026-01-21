"use client";

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
      className={`space-y-6 rounded-[26px] border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-5 shadow-[var(--shadow-card)] md:p-6 ${
        className ?? ""
      }`}
    >
      <div>
        <h2 className="font-display text-2xl text-[color:var(--ink-900)]">
          Pick a focus.
        </h2>
        <p className="mt-2 text-sm text-[color:var(--ink-700)]">
          Choose the timeline that matches your recruiting window.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {FOCUS_OPTIONS.map((option) => (
          <button
            key={option.key}
            className="group flex h-full flex-col justify-between rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] p-4 text-left shadow-[var(--shadow-soft)] transition hover:border-[color:var(--line-strong)] animate-fade"
            onClick={() => handleSelect(option.key)}
            type="button"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-lg text-[color:var(--ink-900)]">
                  {option.label}
                </p>
                <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-2.5 py-0.5 text-xs font-semibold text-[color:var(--ink-600)]">
                  {option.timing}
                </span>
              </div>
              <p className="mt-3 text-sm text-[color:var(--ink-700)]">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
