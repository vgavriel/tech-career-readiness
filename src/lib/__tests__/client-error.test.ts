"use client";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setupReport = async () => {
  vi.resetModules();
  const clientModule = await import("@/lib/client-error");
  return clientModule.reportClientError;
};

describe("reportClientError", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(null));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses sendBeacon when available", async () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
    });

    const reportClientError = await setupReport();
    reportClientError({ message: "Boom" });

    expect(sendBeacon).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("falls back to fetch and dedupes quickly", async () => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: undefined,
      configurable: true,
    });

    const reportClientError = await setupReport();
    reportClientError({ message: "Boom", name: "Error" });
    reportClientError({ message: "Boom", name: "Error" });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("allows another report after the dedupe window", async () => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: undefined,
      configurable: true,
    });

    const reportClientError = await setupReport();
    reportClientError({ message: "Boom" });

    vi.advanceTimersByTime(6_000);
    reportClientError({ message: "Boom" });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
