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

const WIDTH_STEPS = [20, 22, 24, 26, 28, 30, 32, 34] as const;
const MIN_WIDTH = WIDTH_STEPS[0];
const MAX_WIDTH = WIDTH_STEPS[WIDTH_STEPS.length - 1];
const GRID_TEMPLATE_BY_WIDTH: Record<(typeof WIDTH_STEPS)[number], string> = {
  20: "grid-cols-[20%_12px_minmax(0,1fr)]",
  22: "grid-cols-[22%_12px_minmax(0,1fr)]",
  24: "grid-cols-[24%_12px_minmax(0,1fr)]",
  26: "grid-cols-[26%_12px_minmax(0,1fr)]",
  28: "grid-cols-[28%_12px_minmax(0,1fr)]",
  30: "grid-cols-[30%_12px_minmax(0,1fr)]",
  32: "grid-cols-[32%_12px_minmax(0,1fr)]",
  34: "grid-cols-[34%_12px_minmax(0,1fr)]",
};
const COLLAPSED_GRID_CLASS = "grid-cols-[0px_12px_minmax(0,1fr)]";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export default function NavigatorLayout({
  navigator,
  children,
}: NavigatorLayoutProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [navigatorWidth, setNavigatorWidth] = useState<(typeof WIDTH_STEPS)[number]>(26);
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
      const nextPercent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      const clamped = clamp(nextPercent, MIN_WIDTH, MAX_WIDTH);
      const closest = WIDTH_STEPS.reduce((best, candidate) =>
        Math.abs(candidate - clamped) < Math.abs(best - clamped) ? candidate : best
      );

      setNavigatorWidth(closest);
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

  const gridClass = useMemo(
    () => (isCollapsed ? COLLAPSED_GRID_CLASS : GRID_TEMPLATE_BY_WIDTH[navigatorWidth]),
    [isCollapsed, navigatorWidth]
  );

  return (
    <div
      ref={containerRef}
      className={`page-content mx-auto grid h-full w-full max-w-[1400px] items-start gap-0 px-4 py-3 md:px-5 md:py-4 ${gridClass}`}
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
        className={`relative flex h-full min-h-0 items-center justify-center touch-none ${
          isDragging ? "cursor-col-resize" : "cursor-ew-resize"
        }`}
        onPointerDown={handlePointerDown}
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
