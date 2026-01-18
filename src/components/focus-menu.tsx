"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useFocus } from "@/components/focus-provider";
import { FOCUS_OPTIONS, type FocusKey } from "@/lib/focus-options";

export default function FocusMenu() {
  const { focusKey, isUpdating, setFocusKey } = useFocus();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeOption = useMemo(
    () => FOCUS_OPTIONS.find((option) => option.key === focusKey) ?? null,
    [focusKey]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (nextFocusKey: FocusKey | null) => {
    void setFocusKey(nextFocusKey);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-900)] transition hover:border-[color:var(--ink-900)]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>
          {activeOption ? `Focus: ${activeOption.label}` : "Choose a focus"}
        </span>
        <svg
          aria-hidden="true"
          className={`h-3 w-3 transition ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-3 w-[min(420px,92vw)] rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-500)]">
                Focus selection
              </p>
              <p className="mt-1 text-sm text-[color:var(--ink-700)]">
                Keep the navigator tuned to what matters most now.
              </p>
            </div>
            {isUpdating ? (
              <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--ink-700)]">
                Saving...
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3">
            {FOCUS_OPTIONS.map((option) => {
              const isActive = option.key === focusKey;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleSelect(option.key)}
                  className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-[color:var(--accent-700)] bg-[color:var(--accent-500)] text-[color:var(--ink-900)]"
                      : "border-[color:var(--line-soft)] bg-[color:var(--wash-50)] text-[color:var(--ink-700)] hover:border-[color:var(--line-strong)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-base text-[color:var(--ink-900)]">
                      {option.label}
                    </span>
                    <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--ink-600)]">
                      {option.timing}
                    </span>
                  </div>
                  <span className="text-xs">{option.description}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line-soft)] pt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--ink-600)]">
            <button
              type="button"
              className="rounded-full border border-[color:var(--line-soft)] px-4 py-2 text-[color:var(--ink-700)] transition hover:border-[color:var(--ink-900)]"
              onClick={() => handleSelect(null)}
              disabled={!focusKey}
            >
              Clear focus
            </button>
            <Link
              href="/roles"
              className="rounded-full border border-[color:var(--accent-500)] bg-[color:var(--accent-500)] px-4 py-2 text-[color:var(--ink-900)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color:var(--ink-900)]"
            >
              Explore Brown roles
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
