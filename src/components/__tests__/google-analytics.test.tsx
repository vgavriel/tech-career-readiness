import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Link from "next/link";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GoogleAnalytics from "@/components/google-analytics";
import { captureAnalytics } from "@/lib/__tests__/fixtures/capture-analytics";
import {
  GA_MEASUREMENT_ID,
  markSignInStarted,
  resetAnalyticsForTests,
  SITE_NAME,
} from "@/lib/analytics";

const sessionMocks = vi.hoisted(() => ({
  useSession: vi.fn(),
}));

/** jsdom always runs on localhost, so tests can force the "real visit" answer. */
const enableMocks = vi.hoisted(() => ({ forceEnabled: false }));

vi.mock("@/lib/analytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/analytics")>();
  return {
    ...actual,
    shouldEnableAnalytics: (context: Parameters<typeof actual.shouldEnableAnalytics>[0]) =>
      enableMocks.forceEnabled || actual.shouldEnableAnalytics(context),
  };
});

vi.mock("next-auth/react", () => ({
  useSession: (...args: unknown[]) => sessionMocks.useSession(...args),
}));

type TestWindow = Window & { dataLayer?: IArguments[] };

describe("GoogleAnalytics", () => {
  let capture: ReturnType<typeof captureAnalytics>;

  beforeEach(() => {
    resetAnalyticsForTests();
    delete (window as TestWindow).dataLayer;
    sessionStorage.clear();
    sessionMocks.useSession.mockReturnValue({ data: null, status: "unauthenticated" });
    capture = captureAnalytics();
  });

  afterEach(() => {
    capture.stop();
    enableMocks.forceEnabled = false;
    document
      .querySelectorAll('script[src*="googletagmanager"]')
      .forEach((script) => script.remove());
  });

  it("loads gtag.js right away on real visits, with site_name on the tag", () => {
    enableMocks.forceEnabled = true;
    render(<GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />);

    const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
    expect(scripts).toHaveLength(1);
    const config = ((window as TestWindow).dataLayer ?? [])
      .map((entry) => Array.from(entry))
      .find(([command]) => command === "config");
    expect(config?.[2]).toMatchObject({ site_name: SITE_NAME });
  });

  it("stays off on localhost even with a measurement id", () => {
    render(<GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />);

    expect((window as TestWindow).dataLayer).toBeUndefined();
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
  });

  it("sends login once after a sign-in started in this tab", async () => {
    markSignInStarted("google");
    sessionMocks.useSession.mockReturnValue({ data: {}, status: "authenticated" });

    const { rerender } = render(<GoogleAnalytics measurementId={null} />);
    rerender(<GoogleAnalytics measurementId={null} />);

    await waitFor(() =>
      expect(capture.named("login")).toEqual([{ event: "login", params: { method: "google" } }])
    );
  });

  it("does not send login for visitors who were already signed in", () => {
    sessionMocks.useSession.mockReturnValue({ data: {}, status: "authenticated" });
    render(<GoogleAnalytics measurementId={null} />);

    expect(capture.named("login")).toEqual([]);
  });

  it("reports clicks on course navigation controls", async () => {
    render(
      <>
        <GoogleAnalytics measurementId={null} />
        <Link href="/lesson/build-experience" data-analytics-nav="next_core_lesson">
          Next core lesson
        </Link>
        <a href="/roadmap">Roadmap</a>
      </>
    );

    await userEvent.click(screen.getByText("Next core lesson"));
    await userEvent.click(screen.getByText("Roadmap"));

    expect(capture.named("navigation_click")).toEqual([
      {
        event: "navigation_click",
        params: { nav_element: "next_core_lesson", link_url: "/lesson/build-experience" },
      },
    ]);
  });
});
