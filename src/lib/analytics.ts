/**
 * Google Analytics 4 (gtag.js) integration.
 *
 * Events go to the same GA4 property as the Career Exploration Library, so
 * reports can combine both sites. Every event carries
 * `site_name: "tech-career-readiness"` to tell them apart. Page views come from
 * GA4's enhanced measurement ("page changes based on browser history events"),
 * so the app never sends `page_view` itself.
 *
 * Events can be tracked before analytics start (child effects run before the
 * provider's); they wait in a queue until `startAnalytics` decides whether
 * analytics are on. Every event is also dispatched on `document` as a
 * `tcr:analytics` CustomEvent, so tests and other tools can observe it.
 *
 * Google Analytics' terms forbid sending personal details, so email addresses
 * and long numbers are removed from link URLs and link text before sending.
 */

/** CCE's GA4 property, shared with the Career Exploration Library. */
export const GA_MEASUREMENT_ID = "G-40SVVNLXG8";

/** Sent with every event so reports can separate this site from the library. */
export const SITE_NAME = "tech-career-readiness";

/** Name of the CustomEvent dispatched on `document` for every tracked event. */
export const ANALYTICS_DOM_EVENT = "tcr:analytics";

/**
 * European Economic Area, United Kingdom, and Switzerland. Analytics cookies
 * there default to denied (consent mode), since the site has no consent
 * banner. GA4 then sends cookieless pings for those visitors.
 */
export const CONSENT_DENIED_REGIONS = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "IS",
  "LI",
  "NO",
  "GB",
  "CH",
];

export type EventParams = Record<string, string | number | boolean>;

/** Detail of the `tcr:analytics` CustomEvent. */
export type AnalyticsDomEventDetail = {
  event: string;
  params: EventParams;
};

type Gtag = (...args: unknown[]) => void;

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: Gtag;
};

const LOCAL_HOST = /^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\]|.+\.localhost)$/i;
const EMAIL = /[^\s@/?&=#:]+@[^\s@/?&=#]+\.[a-z]{2,}/gi;
/** Phone, student ID, and card-like numbers: 7+ digits, maybe separated. */
const LONG_NUMBER = /\d(?:[\s().-]*\d){6,}/g;
/** GA4 drops parameter values longer than this. */
const MAX_VALUE_LENGTH = 100;
/** Events tracked before `startAnalytics` runs are capped, in case it never does. */
const MAX_PENDING_EVENTS = 50;

/**
 * Removes personal details from text and trims it to GA4's value limit.
 */
export const redactText = (text: string) =>
  text
    .replace(/\s+/g, " ")
    .trim()
    .replace(EMAIL, "[email]")
    .replace(LONG_NUMBER, "[number]")
    .slice(0, MAX_VALUE_LENGTH);

/**
 * Removes email addresses from a URL, and the number from `tel:` links.
 * Other numbers stay: in URLs they are usually page ids (job postings, docs).
 */
export const redactUrl = (href: string) =>
  /^tel:/i.test(href) ? "tel:[number]" : href.replace(EMAIL, "[email]");

/**
 * Server-side switch: GA4 runs only in production, never in Vercel preview
 * deployments (which also build with NODE_ENV=production), and can be turned
 * off with GOOGLE_ANALYTICS_ENABLED=false.
 */
export const isGoogleAnalyticsAllowed = ({
  isProduction,
  vercelEnv,
  flag,
}: {
  isProduction: boolean;
  vercelEnv?: string;
  flag?: string;
}) =>
  flag?.toLowerCase() !== "false" &&
  isProduction &&
  (vercelEnv === undefined || vercelEnv === "production");

type EnableContext = {
  measurementId: string | null;
  hostname: string;
  webdriver: boolean;
  params: URLSearchParams;
};

/**
 * Analytics stay off unless the server enabled them (production only), and
 * also on local hosts, in automated browsers (tests), and for links with
 * `?analytics=off`, so testing never pollutes the shared GA property.
 */
export const shouldEnableAnalytics = ({
  measurementId,
  hostname,
  webdriver,
  params,
}: EnableContext) =>
  Boolean(measurementId) &&
  !webdriver &&
  !LOCAL_HOST.test(hostname) &&
  params.get("analytics") !== "off";

type AnalyticsState =
  | { status: "pending"; queue: AnalyticsDomEventDetail[] }
  | { status: "on"; win: AnalyticsWindow; measurementId: string; scriptAdded: boolean }
  | { status: "off" };

let state: AnalyticsState = { status: "pending", queue: [] };

/**
 * Track an event. Safe to call anywhere on the client, before or after
 * analytics start, and whether they are on or off.
 */
export const trackEvent = (event: string, params: EventParams = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  document.dispatchEvent(
    new CustomEvent<AnalyticsDomEventDetail>(ANALYTICS_DOM_EVENT, { detail: { event, params } })
  );

  if (state.status === "pending") {
    if (state.queue.length < MAX_PENDING_EVENTS) {
      state.queue.push({ event, params });
    }
  } else if (state.status === "on") {
    state.win.gtag?.("event", event, params);
  }
};

/**
 * Turn analytics on or off for this page. Queues the standard gtag.js
 * bootstrap (consent defaults, `site_name`, config) and sends anything
 * tracked so far; gtag.js itself is downloaded later by `loadAnalyticsScript`.
 * Only the first call has an effect.
 */
export const startAnalytics = ({
  measurementId,
  enabled,
  win = window,
}: {
  measurementId: string | null;
  enabled: boolean;
  win?: Window;
}) => {
  if (state.status !== "pending") {
    return;
  }

  const queued = state.queue;
  if (!enabled || !measurementId) {
    state = { status: "off" };
    return;
  }

  const analyticsWindow = win as AnalyticsWindow;
  const dataLayer = (analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? []);
  // gtag.js reads the `arguments` object itself, not an array copy.
  analyticsWindow.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  };

  const gtag = analyticsWindow.gtag;
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    region: CONSENT_DENIED_REGIONS,
  });
  gtag("js", new Date());
  gtag("set", { site_name: SITE_NAME });
  gtag("config", measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  state = { status: "on", win: analyticsWindow, measurementId, scriptAdded: false };
  for (const { event, params } of queued) {
    gtag("event", event, params);
  }
};

/**
 * Download gtag.js, which then sends the page view and everything queued.
 * Does nothing when analytics are off or on later calls.
 */
export const loadAnalyticsScript = () => {
  if (state.status !== "on" || state.scriptAdded) {
    return;
  }

  state.scriptAdded = true;
  const script = state.win.document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    state.measurementId
  )}`;
  state.win.document.head.append(script);
};

/**
 * Forget whether analytics started. For tests only.
 */
export const resetAnalyticsForTests = () => {
  state = { status: "pending", queue: [] };
};

const SIGN_IN_STARTED_KEY = "tcr:sign-in-started";

/**
 * Remember that the visitor started signing in, and how, so the `login` event
 * can be sent once they come back signed in.
 */
export const markSignInStarted = (method: string) => {
  try {
    sessionStorage.setItem(SIGN_IN_STARTED_KEY, method);
  } catch {
    // Without storage, the sign-in just isn't counted.
  }
};

/**
 * Return the sign-in method started in this tab, if any, and forget it.
 */
export const consumeSignInStarted = () => {
  try {
    const method = sessionStorage.getItem(SIGN_IN_STARTED_KEY);
    sessionStorage.removeItem(SIGN_IN_STARTED_KEY);
    return method;
  } catch {
    return null;
  }
};
