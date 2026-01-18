"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type NavigatorLayoutProps = {
  navigator: React.ReactNode;
  children: React.ReactNode;
};

const MIN_WIDTH = 0.15;
const MAX_WIDTH = 0.35;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function NavigatorLayout({
  navigator,
  children,
}: NavigatorLayoutProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [navigatorWidth, setNavigatorWidth] = useState(0.25);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isCollapsedRef = useRef(isCollapsed);
  const collapsedByMediaRef = useRef(false);
  const collapsedStateBeforeAutoRef = useRef(false);

  useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 960px)");
    const handleChange = () => {
      if (media.matches) {
        collapsedByMediaRef.current = true;
        collapsedStateBeforeAutoRef.current = isCollapsedRef.current;
        setIsCollapsed(true);
        return;
      }

      if (collapsedByMediaRef.current) {
        setIsCollapsed(collapsedStateBeforeAutoRef.current);
        collapsedByMediaRef.current = false;
      }
    };

    handleChange();
    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent) => {
    if (!containerRef.current) {
      return;
    }

    event.preventDefault();
    setIsDragging(true);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const nextValue = (moveEvent.clientX - rect.left) / rect.width;
      const clamped = clamp(nextValue, MIN_WIDTH, MAX_WIDTH);

      setNavigatorWidth(clamped);
      setIsCollapsed(false);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }, []);

  const gridTemplateColumns = useMemo(
    () =>
      `${isCollapsed ? "0px" : `${navigatorWidth * 100}%`} 12px minmax(0, 1fr)`,
    [isCollapsed, navigatorWidth]
  );

  return (
    <div
      ref={containerRef}
      className="page-content mx-auto grid h-full w-full max-w-[1400px] items-start gap-0 px-4 py-3 md:px-5 md:py-4"
      style={{ gridTemplateColumns }}
    >
      <aside
        className={`h-full min-h-0 overflow-hidden rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] shadow-[var(--shadow-card)] transition-[width] duration-200 ${
          isCollapsed ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden={isCollapsed}
      >
        <div className="flex h-full flex-col">{navigator}</div>
      </aside>

      <div
        className={`relative flex h-full min-h-0 items-center justify-center ${
          isDragging ? "cursor-col-resize" : "cursor-ew-resize"
        }`}
        onPointerDown={handlePointerDown}
        style={{ touchAction: "none" }}
        aria-hidden="true"
      >
        <div className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-[color:var(--line-soft)]" />
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            setIsCollapsed((collapsed) => !collapsed);
          }}
          className="absolute top-3 flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-700)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--ink-900)]"
          aria-label={isCollapsed ? "Expand navigator" : "Collapse navigator"}
        >
          <svg
            aria-hidden="true"
            className={`h-3.5 w-3.5 transition ${
              isCollapsed ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 6l-6 6 6 6"
            />
          </svg>
        </button>
      </div>

      <main className="scroll-panel flex h-full min-h-0 flex-col gap-6 overflow-y-auto rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--wash-0)] px-4 pb-8 pt-6 shadow-[var(--shadow-card)] md:px-6 md:pt-7">
        {children}
      </main>
    </div>
  );
}
