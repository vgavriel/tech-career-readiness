import { createHash } from "crypto";
import { describe, expect, it } from "vitest";

import { scrubClientError } from "@/lib/client-error-scrub";
import type { ClientErrorPayload } from "@/lib/client-error-shared";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

describe("scrubClientError", () => {
  it("strips query params and hashes the user agent", async () => {
    const payload: ClientErrorPayload = {
      message: "Something went wrong",
      url: "https://example.com/lesson/intro?email=student@example.com#token=abc",
      userAgent: "Test UA",
    };

    const scrubbed = await scrubClientError(payload);

    expect(scrubbed.urlPath).toBe("/lesson/intro");
    expect(scrubbed.userAgentHash).toBe(sha256("Test UA"));
    expect(scrubbed).not.toHaveProperty("userAgent");
    expect(scrubbed).not.toHaveProperty("url");
  });

  it("handles relative URLs by keeping the pathname only", async () => {
    const payload: ClientErrorPayload = {
      message: "Boom",
      url: "/lesson/intro?utm_source=demo",
    };

    const scrubbed = await scrubClientError(payload);

    expect(scrubbed.urlPath).toBe("/lesson/intro");
  });

  it("keeps pathnames for absolute URLs", async () => {
    const payload: ClientErrorPayload = {
      message: "Boom",
      url: "https://example.com/lesson/intro?utm_source=demo",
    };

    const scrubbed = await scrubClientError(payload);

    expect(scrubbed.urlPath).toBe("/lesson/intro");
  });

  it("limits stack lines and message length", async () => {
    const stack = Array.from({ length: 10 }, (_, index) => `line-${index + 1}`).join("\n");
    const payload: ClientErrorPayload = {
      message: "x".repeat(1000),
      stack,
    };

    const scrubbed = await scrubClientError(payload);

    expect(scrubbed.message.length).toBeLessThanOrEqual(300);
    expect(scrubbed.stack?.split("\n").length).toBeLessThanOrEqual(5);
  });
});
