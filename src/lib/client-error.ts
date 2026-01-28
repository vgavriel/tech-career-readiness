"use client";

import type { ClientErrorPayload } from "@/lib/client-error-shared";

const RECENT_ERRORS = new Map<string, number>();
const RECENT_TTL_MS = 5_000;

/**
 * Clamp a string to a maximum length, preserving undefined values.
 */
const truncateValue = (value: string | undefined, max = 2_000) => {
  if (!value) {
    return value;
  }
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}…`;
};

/**
 * Build a stable signature for deduplicating error reports.
 */
const buildSignature = (payload: ClientErrorPayload) =>
  [payload.message, payload.name, payload.stack, payload.source, payload.lineno, payload.colno]
    .filter(Boolean)
    .join("|");

/**
 * Decide whether an error should be reported based on a short dedupe window.
 */
const shouldReport = (payload: ClientErrorPayload, now = Date.now()) => {
  const signature = buildSignature(payload);
  const previous = RECENT_ERRORS.get(signature);
  if (previous && now - previous < RECENT_TTL_MS) {
    return false;
  }
  RECENT_ERRORS.set(signature, now);
  return true;
};

/**
 * Report a client error from the browser, using sendBeacon when available.
 *
 * Deduplicates repeated errors within a short window and truncates large fields
 * to keep payload sizes reasonable.
 */
export const reportClientError = (payload: ClientErrorPayload) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized: ClientErrorPayload = {
    ...payload,
    message: truncateValue(payload.message, 500) ?? "Unknown client error",
    name: truncateValue(payload.name, 200),
    stack: truncateValue(payload.stack, 4_000),
    componentStack: truncateValue(payload.componentStack, 2_000),
    url: payload.url ?? window.location.href,
    userAgent: payload.userAgent ?? navigator.userAgent,
  };

  if (!shouldReport(normalized)) {
    return;
  }

  const body = JSON.stringify(normalized);

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/client-error", blob);
    return;
  }

  void fetch("/api/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  });
};
