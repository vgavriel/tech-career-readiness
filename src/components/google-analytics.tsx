"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

import {
  consumeSignInStarted,
  loadAnalyticsScript,
  shouldEnableAnalytics,
  startAnalytics,
  trackEvent,
} from "@/lib/analytics";

/**
 * Props for the Google Analytics loader.
 */
type GoogleAnalyticsProps = {
  measurementId: string | null;
};

/**
 * Report clicks on elements marked with `data-analytics-nav` (course
 * navigation controls) as `navigation_click` events.
 */
const handleNavigationClick = (event: MouseEvent) => {
  const target = event.target instanceof Element ? event.target : null;
  const element = target?.closest<HTMLElement>("[data-analytics-nav]");
  if (!element) {
    return;
  }

  const href = element.getAttribute("href");
  trackEvent("navigation_click", {
    nav_element: element.dataset.analyticsNav ?? "",
    ...(href ? { link_url: new URL(href, window.location.href).pathname } : {}),
  });
};

/**
 * Start Google Analytics for this page and send app-wide events.
 *
 * @remarks
 * gtag.js loads (async) as soon as the app hydrates, not after the window
 * `load` event: lesson pages stream, so `load` can wait for a slow Google Doc,
 * and visits or clicks before it would be lost. The lesson content is fetched
 * on the server, so the download doesn't compete with it. Renders nothing.
 */
export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const { status } = useSession();

  useEffect(() => {
    const enabled = shouldEnableAnalytics({
      measurementId,
      hostname: window.location.hostname,
      webdriver: navigator.webdriver,
      params: new URLSearchParams(window.location.search),
    });
    startAnalytics({ measurementId, enabled });
    loadAnalyticsScript();
  }, [measurementId]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    const method = consumeSignInStarted();
    if (method) {
      trackEvent("login", { method });
    }
  }, [status]);

  useEffect(() => {
    document.addEventListener("click", handleNavigationClick, true);
    return () => document.removeEventListener("click", handleNavigationClick, true);
  }, []);

  return null;
}
