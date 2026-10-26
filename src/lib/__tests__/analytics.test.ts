import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  CONSENT_DENIED_REGIONS,
  consumeSignInStarted,
  GA_MEASUREMENT_ID,
  isGoogleAnalyticsAllowed,
  loadAnalyticsScript,
  markSignInStarted,
  redactText,
  redactUrl,
  resetAnalyticsForTests,
  shouldEnableAnalytics,
  SITE_NAME,
  startAnalytics,
  trackEvent,
} from "@/lib/analytics";

import { captureAnalytics } from "./fixtures/capture-analytics";

type TestWindow = Window & { dataLayer?: IArguments[]; gtag?: unknown };

const testWindow = window as TestWindow;

/** The gtag commands queued in `dataLayer`, as plain arrays. */
const gtagCommands = () => (testWindow.dataLayer ?? []).map((entry) => Array.from(entry));

const gtagScripts = () =>
  Array.from(document.head.querySelectorAll("script")).filter((script) =>
    script.src.startsWith("https://www.googletagmanager.com/gtag/js")
  );

describe("analytics", () => {
  beforeEach(() => {
    resetAnalyticsForTests();
    delete testWindow.dataLayer;
    delete testWindow.gtag;
    sessionStorage.clear();
  });

  afterEach(() => {
    for (const script of gtagScripts()) {
      script.remove();
    }
  });

  describe("redaction", () => {
    it("removes emails and long numbers from text and trims it", () => {
      expect(redactText("  Email   jo@brown.edu or call 401 555 0100 ")).toBe(
        "Email [email] or call [number]"
      );
      expect(redactText("x".repeat(150))).toHaveLength(100);
    });

    it("keeps page ids in URLs but removes emails and phone numbers", () => {
      expect(redactUrl("https://www.linkedin.com/jobs/view/4012345678")).toBe(
        "https://www.linkedin.com/jobs/view/4012345678"
      );
      expect(redactUrl("mailto:CareerCenter@brown.edu")).toBe("mailto:[email]");
      expect(redactUrl("https://example.com/?ref=jo@brown.edu")).toBe(
        "https://example.com/?ref=[email]"
      );
      expect(redactUrl("tel:+1-401-863-3326")).toBe("tel:[number]");
      expect(redactUrl("mailto:student%40brown.edu")).toBe("mailto:[email]");
      expect(redactUrl("https://example.com/?email=first.last%40brown.edu&x=1")).toBe(
        "https://example.com/?email=[email]&x=1"
      );
    });
  });

  describe("isGoogleAnalyticsAllowed", () => {
    it.each([
      [{ isProduction: true }, true],
      [{ isProduction: true, vercelEnv: "production" }, true],
      [{ isProduction: true, vercelEnv: "preview" }, false],
      [{ isProduction: true, vercelEnv: "development" }, false],
      [{ isProduction: false }, false],
      [{ isProduction: true, flag: "FALSE" }, false],
      [{ isProduction: true, flag: "true" }, true],
    ])("returns the right answer for %o", (input, expected) => {
      expect(isGoogleAnalyticsAllowed(input)).toBe(expected);
    });
  });

  describe("shouldEnableAnalytics", () => {
    const base = {
      measurementId: GA_MEASUREMENT_ID,
      hostname: "tech-career-readiness.vercel.app",
      webdriver: false,
      params: new URLSearchParams(),
    };

    it("is on for real visits to the deployed site", () => {
      expect(shouldEnableAnalytics(base)).toBe(true);
    });

    it.each([
      ["no measurement id", { measurementId: null }],
      ["automated browsers", { webdriver: true }],
      ["localhost", { hostname: "localhost" }],
      ["loopback addresses", { hostname: "127.0.0.1" }],
      ["*.localhost", { hostname: "app.localhost" }],
      ["?analytics=off", { params: new URLSearchParams("analytics=off") }],
    ])("is off for %s", (_label, override) => {
      expect(shouldEnableAnalytics({ ...base, ...override })).toBe(false);
    });
  });

  it("dispatches every event on document, whether analytics are on or off", () => {
    const capture = captureAnalytics();
    trackEvent("before_start", { a: 1 });
    startAnalytics({ measurementId: GA_MEASUREMENT_ID, enabled: false });
    trackEvent("after_start");
    capture.stop();

    expect(capture.events).toEqual([
      { event: "before_start", params: { a: 1 } },
      { event: "after_start", params: {} },
    ]);
    expect(testWindow.dataLayer).toBeUndefined();
  });

  it("bootstraps gtag with regional consent defaults, site_name, and no ads signals", () => {
    trackEvent("queued_event", { lesson_slug: "intro" });
    startAnalytics({ measurementId: GA_MEASUREMENT_ID, enabled: true });
    trackEvent("later_event");

    const commands = gtagCommands();
    expect(commands[0]).toEqual([
      "consent",
      "default",
      {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        region: CONSENT_DENIED_REGIONS,
      },
    ]);
    expect(commands[1][0]).toBe("js");
    expect(commands.slice(2)).toEqual([
      ["set", { site_name: SITE_NAME }],
      [
        "config",
        GA_MEASUREMENT_ID,
        { allow_google_signals: false, allow_ad_personalization_signals: false },
      ],
      ["event", "queued_event", { lesson_slug: "intro" }],
      ["event", "later_event", {}],
    ]);
    expect(CONSENT_DENIED_REGIONS).toEqual(expect.arrayContaining(["DE", "FR", "GB", "CH", "NO"]));
    expect(CONSENT_DENIED_REGIONS).not.toContain("US");
  });

  it("only starts once", () => {
    startAnalytics({ measurementId: GA_MEASUREMENT_ID, enabled: false });
    startAnalytics({ measurementId: GA_MEASUREMENT_ID, enabled: true });
    trackEvent("ignored");

    expect(testWindow.dataLayer).toBeUndefined();
  });

  it("stops queueing events if analytics never start", () => {
    for (let index = 0; index < 60; index += 1) {
      trackEvent("queued", { index });
    }
    startAnalytics({ measurementId: GA_MEASUREMENT_ID, enabled: true });

    expect(gtagCommands().filter(([command]) => command === "event")).toHaveLength(50);
  });

  it("adds gtag.js once, and only when analytics are on", () => {
    loadAnalyticsScript();
    expect(gtagScripts()).toHaveLength(0);

    startAnalytics({ measurementId: GA_MEASUREMENT_ID, enabled: true });
    loadAnalyticsScript();
    loadAnalyticsScript();

    const scripts = gtagScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0].async).toBe(true);
    expect(scripts[0].src).toBe(`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`);
  });

  it("does nothing without a measurement id", () => {
    startAnalytics({ measurementId: null, enabled: true });
    loadAnalyticsScript();

    expect(testWindow.dataLayer).toBeUndefined();
    expect(gtagScripts()).toHaveLength(0);
  });

  it("remembers a started sign-in once", () => {
    expect(consumeSignInStarted()).toBeNull();
    markSignInStarted("google");
    expect(consumeSignInStarted()).toBe("google");
    expect(consumeSignInStarted()).toBeNull();
  });
});
