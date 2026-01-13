import { describe, expect, it } from "vitest";

import { enforceStateChangeSecurity } from "@/lib/request-guard";

describe("enforceStateChangeSecurity", () => {
  it("allows same-origin JSON POST requests", () => {
    const request = new Request("http://localhost/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost",
      },
    });

    expect(enforceStateChangeSecurity(request)).toBeNull();
  });

  it("rejects POST requests without an origin", () => {
    const request = new Request("http://localhost/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = enforceStateChangeSecurity(request);
    expect(response?.status).toBe(403);
  });

  it("rejects POST requests with a non-JSON content type", () => {
    const request = new Request("http://localhost/api/progress", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        Origin: "http://localhost",
      },
    });

    const response = enforceStateChangeSecurity(request);
    expect(response?.status).toBe(415);
  });
});
