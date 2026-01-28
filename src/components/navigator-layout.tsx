"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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

/**
 * Clamp a numeric value between a minimum and maximum.
 */
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Layout shell that hosts the lesson navigator and main content panel.
 */
export default function NavigatorLayout({ navigator, children }: NavigatorLayoutProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const [navigatorWidth, setNavigatorWidth] = useState<(typeof WIDTH_STEPS)[number]>(26);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
    /**
     * Sync collapse state when switching between mobile and desktop widths.
     */
    const handleChange = () => {
      const matches = media.matches;
      setIsMobile(matches);
      if (matches) {
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

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (isMobile || !containerRef.current) {
        return;
      }

      event.preventDefault();
      setIsDragging(true);

      /**
       * Track pointer movement to resize the navigator column.
       */
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

      /**
       * Stop tracking pointer movement when dragging ends.
       */
      const handlePointerUp = () => {
        setIsDragging(false);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [isMobile]
  );

  const handleResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (isMobile) {
        return;
      }
      const currentIndex = WIDTH_STEPS.indexOf(navigatorWidth);

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (isCollapsed) {
          return;
        }
        if (currentIndex <= 0) {
          setIsCollapsed(true);
          return;
        }
        setNavigatorWidth(WIDTH_STEPS[currentIndex - 1]);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isCollapsed) {
          setIsCollapsed(false);
          setNavigatorWidth(MIN_WIDTH);
          return;
        }
        if (currentIndex >= WIDTH_STEPS.length - 1) {
          return;
        }
        setNavigatorWidth(WIDTH_STEPS[currentIndex + 1]);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setIsCollapsed(false);
        setNavigatorWidth(MIN_WIDTH);
      }

      if (event.key === "End") {
        event.preventDefault();
        setIsCollapsed(false);
        setNavigatorWidth(MAX_WIDTH);
      }
    },
    [isCollapsed, isMobile, navigatorWidth]
  );

  const gridClass = useMemo(() => {
    if (isMobile) {
      return "grid-cols-1";
    }
    return isCollapsed ? COLLAPSED_GRID_CLASS : GRID_TEMPLATE_BY_WIDTH[navigatorWidth];
  }, [isCollapsed, isMobile, navigatorWidth]);
  const showMobileOverlay = isMobile && !isCollapsed;

  const normalizeHash = useCallback((hash: string) => {
    const trimmed = hash.trim();
    if (!trimmed || !trimmed.startsWith("#") || trimmed.length < 2) {
      return null;
    }

    const rawId = trimmed.slice(1);
    try {
      return decodeURIComponent(rawId);
    } catch {
      return rawId;
    }
  }, []);

  const scrollToHash = useCallback(
    (hash: string, behavior: ScrollBehavior = "auto") => {
      const main = mainRef.current;
      if (!main) {
        return;
      }

      const id = normalizeHash(hash);
      if (!id) {
        return;
      }

      const target = document.getElementById(id);
      if (!target) {
        return;
      }

      const mainRect = main.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const nextTop = Math.max(0, targetRect.top - mainRect.top + main.scrollTop);
      main.scrollTo({ top: nextTop, behavior });

      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    },
    [normalizeHash]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    /**
     * Scroll to the hash target when the URL hash changes.
     */
    const handleHash = () => {
      scrollToHash(window.location.hash);
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handleHash);

    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("popstate", handleHash);
    };
  }, [scrollToHash]);

  const handleMainClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("#")) {
        return;
      }

      const id = normalizeHash(href);
      if (!id || !document.getElementById(id)) {
        return;
      }

      event.preventDefault();

      if (window.location.hash !== href) {
        window.history.pushState(null, "", href);
      }

      scrollToHash(href);
    },
    [normalizeHash, scrollToHash]
  );

  return (
    <div
      ref={containerRef}
      className={`page-content relative mx-auto grid h-full w-full max-w-[1400px] items-start gap-0 px-4 py-4 md:px-6 md:py-6 ${gridClass}`}
    >
      {isMobile && isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="absolute left-6 top-6 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-700)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--ink-900)]"
          aria-label="Open navigator"
          aria-controls="lesson-navigator"
        >
          <svg
            aria-hidden="true"
            className={`h-3.5 w-3.5 transition ${isCollapsed ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      ) : null}
      {showMobileOverlay ? (
        <button
          type="button"
          aria-label="Close navigator"
          onClick={() => setIsCollapsed(true)}
          className="absolute inset-0 z-20 bg-[color:var(--ink-900)]/20"
        />
      ) : null}
      <aside
        id="lesson-navigator"
        aria-label="Lesson navigator"
        className={`min-h-0 overflow-hidden rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] shadow-[var(--shadow-card)] ${
          isMobile
            ? `absolute inset-y-0 left-0 z-30 h-full w-[min(92vw,360px)] transform transition-transform duration-200 ${
                isCollapsed ? "-translate-x-full pointer-events-none" : "translate-x-0"
              }`
            : `h-full transition-[width] duration-200 ${
                isCollapsed ? "pointer-events-none opacity-0" : "opacity-100"
              }`
        }`}
        aria-hidden={isCollapsed}
      >
        <div className="flex h-full flex-col">
          {isMobile ? (
            <div className="flex items-center justify-between border-b border-[color:var(--line-soft)] px-4 py-3">
              <span className="text-sm font-semibold text-[color:var(--ink-700)]">
                Lesson navigator
              </span>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-700)] transition hover:border-[color:var(--ink-900)]"
                aria-label="Close navigator"
              >
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
          ) : null}
          {navigator}
        </div>
      </aside>

      {!isMobile ? (
        <div
          className={`relative flex h-full min-h-0 items-center justify-center touch-none ${
            isDragging ? "cursor-col-resize" : "cursor-ew-resize"
          }`}
          onPointerDown={handlePointerDown}
          role="separator"
          tabIndex={0}
          aria-controls="lesson-navigator"
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={MAX_WIDTH}
          aria-valuenow={isCollapsed ? 0 : navigatorWidth}
          aria-valuetext={
            isCollapsed ? "Navigator collapsed" : `Navigator width ${navigatorWidth}%`
          }
          onKeyDown={handleResizeKeyDown}
        >
          <div className="absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-[color:var(--line-soft)]" />
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setIsCollapsed((collapsed) => !collapsed);
            }}
            className="absolute top-6 flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line-soft)] bg-[color:var(--wash-0)] text-[color:var(--ink-700)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--ink-900)]"
            aria-label={isCollapsed ? "Expand navigator" : "Collapse navigator"}
          >
            <svg
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition ${isCollapsed ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>
      ) : null}

      <main
        id="main-content"
        tabIndex={-1}
        ref={mainRef}
        onClickCapture={handleMainClick}
        className="scroll-panel flex h-full min-h-0 flex-col gap-6 overflow-y-auto rounded-2xl border border-[color:var(--line-soft)] bg-[color:var(--surface)] px-5 pb-8 pt-6 shadow-[var(--shadow-card)] md:px-7 md:pt-8"
      >
        {children}
      </main>
    </div>
  );
}
