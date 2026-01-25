"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useFocus } from "@/components/focus-provider";
import { FOCUS_OPTIONS, type FocusKey } from "@/lib/focus-options";

export default function FocusMenu() {
  const { focusKey, isUpdating, setFocusKey } = useFocus();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const firstOptionRef = useRef<HTMLButtonElement | null>(null);
  const clearTooltipId = useId();
  const isClearDisabled = !focusKey;

  const activeOption = useMemo(
    () => FOCUS_OPTIONS.find((option) => option.key === focusKey) ?? null,
    [focusKey]
  );

  const closeMenu = useCallback((returnFocus = false) => {
    setIsOpen(false);
    if (returnFocus) {
      requestAnimationFrame(() => {
        toggleRef.current?.focus();
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        closeMenu(true);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu(true);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    const focusTimer = requestAnimationFrame(() => {
      firstOptionRef.current?.focus();
    });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(focusTimer);
    };
  }, [closeMenu, isOpen]);

  const handleSelect = (nextFocusKey: FocusKey | null) => {
    void setFocusKey(nextFocusKey);
    closeMenu(true);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        ref={toggleRef}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-4 py-2 text-sm font-semibold text-[color:var(--ink-800)] transition hover:border-[color:var(--ink-900)]"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="focus-menu-panel"
      >
        <span>
          {activeOption ? `Focus: ${activeOption.label}` : "Focus"}
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
        <div
          id="focus-menu-panel"
          className="absolute right-0 z-20 mt-3 w-[min(420px,92vw)] rounded-2xl border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] p-4 shadow-[var(--shadow-card)]"
          role="region"
          aria-label="Focus options"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-[color:var(--ink-700)]">
                Filter by focus.
              </p>
            </div>
            {isUpdating ? (
              <span className="rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-50)] px-2.5 py-1 text-xs font-semibold text-[color:var(--ink-700)]">
                Saving...
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3">
            {FOCUS_OPTIONS.map((option, index) => {
              const isActive = option.key === focusKey;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleSelect(option.key)}
                  ref={index === 0 ? firstOptionRef : null}
                  className={`flex w-full cursor-pointer flex-col gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                    isActive
                      ? "border-[color:var(--accent-700)] bg-[color:var(--accent-300)] text-[color:var(--ink-900)]"
                      : "border-[color:var(--line-soft)] bg-[color:var(--wash-50)] text-[color:var(--ink-700)] hover:border-[color:var(--line-strong)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-display text-base text-[color:var(--ink-900)]">
                      {option.label}
                    </span>
                  </div>
                  <span className="text-xs">{option.description}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line-soft)] pt-3 text-xs font-semibold text-[color:var(--ink-600)]">
            <div
              className={`relative group ${isClearDisabled ? "cursor-not-allowed" : ""}`}
            >
              <button
                type="button"
                className="min-h-11 rounded-full border border-[color:var(--line-soft)] px-3 py-1.5 text-[color:var(--ink-700)] transition enabled:cursor-pointer enabled:hover:border-[color:var(--ink-900)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => handleSelect(null)}
                disabled={isClearDisabled}
                aria-describedby={isClearDisabled ? clearTooltipId : undefined}
              >
                Clear focus
              </button>
              {isClearDisabled ? (
                <span
                  id={clearTooltipId}
                  role="tooltip"
                  className="pointer-events-none absolute right-0 top-0 z-10 -translate-y-full whitespace-nowrap rounded-xl border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] px-3 py-1 text-xs font-semibold text-[color:var(--ink-700)] opacity-0 shadow-[var(--shadow-soft)] transition group-hover:opacity-100"
                >
                  No focus selected.
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
