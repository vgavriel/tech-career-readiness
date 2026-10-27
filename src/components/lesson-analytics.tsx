"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { trackEvent } from "@/lib/analytics";
import { lessonLinkEvent, lessonViewParams } from "@/lib/lesson-analytics";

/**
 * Where the lesson body came from, as the `data_source` parameter of
 * `lesson_load` (the library's `library_load` uses the same parameter).
 */
export type LessonDataSource = "live" | "built_in" | "sample" | "google_doc" | "none";

/**
 * How the lesson was reached, as the `navigation_type` parameter of
 * `lesson_load`. The two measure different spans (see `lessonStart`), so
 * reports should compare `load_time_ms` within one type only.
 */
type LessonNavigationType = "page_load" | "in_app";

type LessonStart = {
  startedAt: number;
  navigationType: LessonNavigationType;
};

type LessonAnalyticsContextValue = LessonStart & {
  lessonSlug: string;
};

const LessonAnalyticsContext = createContext<LessonAnalyticsContextValue | null>(null);

let isFirstLessonInDocument = true;

/**
 * When this lesson started loading.
 *
 * - `page_load`: the browser loaded the lesson directly; timing starts at the
 *   page request, so `load_time_ms` runs until the lesson body is on screen
 *   and interactive (it includes downloading and starting the app).
 * - `in_app`: the visitor moved here inside the app; timing starts when the
 *   lesson frame first renders, so it covers waiting for the lesson body only.
 */
const lessonStart = (): LessonStart => {
  if (typeof window === "undefined") {
    return { startedAt: 0, navigationType: "page_load" };
  }

  const first = isFirstLessonInDocument;
  isFirstLessonInDocument = false;
  const [navigation] = performance.getEntriesByType("navigation");
  if (first && navigation && new URL(navigation.name).pathname === window.location.pathname) {
    return { startedAt: 0, navigationType: "page_load" };
  }
  return { startedAt: performance.now(), navigationType: "in_app" };
};

/**
 * Props for the lesson analytics wrapper.
 */
type LessonAnalyticsProps = {
  lessonSlug: string;
  lessonTitle: string;
  children: ReactNode;
};

/**
 * Send `lesson_view` for the lesson and report clicks on links inside it.
 *
 * @remarks
 * Render with `key={lessonSlug}` so each lesson gets its own start time.
 */
export default function LessonAnalytics({
  lessonSlug,
  lessonTitle,
  children,
}: LessonAnalyticsProps) {
  const [start] = useState(lessonStart);
  const containerRef = useRef<HTMLDivElement>(null);
  const contextValue = useMemo(() => ({ lessonSlug, ...start }), [lessonSlug, start]);

  useEffect(() => {
    trackEvent("lesson_view", lessonViewParams(lessonSlug, lessonTitle));
  }, [lessonSlug, lessonTitle]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    /** Primary clicks, modifier clicks (new tab), and middle clicks all count. */
    const handleLinkClick = (event: MouseEvent) => {
      if (event.type === "auxclick" && event.button !== 1) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const linkEvent = lessonLinkEvent({
        href: anchor.getAttribute("href") ?? "",
        text: anchor.textContent ?? "",
        lessonSlug,
        pageUrl: window.location.href,
      });
      if (linkEvent) {
        trackEvent(linkEvent.event, linkEvent.params);
      }
    };

    container.addEventListener("click", handleLinkClick);
    container.addEventListener("auxclick", handleLinkClick);
    return () => {
      container.removeEventListener("click", handleLinkClick);
      container.removeEventListener("auxclick", handleLinkClick);
    };
  }, [lessonSlug]);

  return (
    <LessonAnalyticsContext.Provider value={contextValue}>
      <div ref={containerRef}>{children}</div>
    </LessonAnalyticsContext.Provider>
  );
}

/**
 * Send `lesson_load` once the lesson body is on screen: where it came from
 * and how long the visitor waited for it.
 */
export function LessonLoadReport({ dataSource }: { dataSource: LessonDataSource }) {
  const context = useContext(LessonAnalyticsContext);

  useEffect(() => {
    if (!context) {
      return;
    }
    trackEvent("lesson_load", {
      lesson_slug: context.lessonSlug,
      data_source: dataSource,
      navigation_type: context.navigationType,
      load_time_ms: Math.round(performance.now() - context.startedAt),
    });
  }, [context, dataSource]);

  return null;
}
