import { ANALYTICS_DOM_EVENT, type AnalyticsDomEventDetail } from "@/lib/analytics";

/**
 * Record every analytics event dispatched on `document` until `stop` is called.
 */
export const captureAnalytics = () => {
  const events: AnalyticsDomEventDetail[] = [];
  const listener = (event: Event) => {
    events.push((event as CustomEvent<AnalyticsDomEventDetail>).detail);
  };
  document.addEventListener(ANALYTICS_DOM_EVENT, listener);

  return {
    events,
    named: (name: string) => events.filter((event) => event.event === name),
    stop: () => document.removeEventListener(ANALYTICS_DOM_EVENT, listener),
  };
};
