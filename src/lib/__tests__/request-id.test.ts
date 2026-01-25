import { describe, expect, it } from "vitest";

import {
  getRequestId,
  REQUEST_ID_HEADER,
  resolveRequestId,
  UNKNOWN_REQUEST_ID,
} from "@/lib/request-id";

describe("getRequestId", () => {
  it("returns a trimmed request id when present", () => {
    const request = new Request("http://localhost", {
      headers: {
        [REQUEST_ID_HEADER]: "  req-123  ",
      },
    });

    expect(getRequestId(request)).toBe("req-123");
  });

  it("returns null when the header is missing", () => {
    const request = new Request("http://localhost");

    expect(getRequestId(request)).toBeNull();
  });

  it("returns null when the header is blank", () => {
    const request = new Request("http://localhost", {
      headers: {
        [REQUEST_ID_HEADER]: "   ",
      },
    });

    expect(getRequestId(request)).toBeNull();
  });
});

describe("resolveRequestId", () => {
  it("returns the request id when present", () => {
    const request = new Request("http://localhost", {
      headers: {
        [REQUEST_ID_HEADER]: "req-456",
      },
    });

    expect(resolveRequestId(request)).toBe("req-456");
  });

  it("falls back to the default placeholder when missing", () => {
    const request = new Request("http://localhost");

    expect(resolveRequestId(request)).toBe(UNKNOWN_REQUEST_ID);
  });

  it("uses a custom fallback when provided", () => {
    const request = new Request("http://localhost");

    expect(resolveRequestId(request, "custom-id")).toBe("custom-id");
  });
});
