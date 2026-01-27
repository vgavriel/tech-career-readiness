import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  errorResponse,
  parseJsonBody,
  tooManyRequestsResponse,
  unauthorizedResponse,
} from "@/lib/api-helpers";

describe("api-helpers", () => {
  it("parses valid JSON bodies", async () => {
    const schema = z.object({ name: z.string() });
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Ada" }),
    });

    const result = await parseJsonBody(request, schema);
    expect("data" in result).toBe(true);
    if ("data" in result) {
      expect(result.data).toEqual({ name: "Ada" });
    }
  });

  it("rejects invalid JSON", async () => {
    const schema = z.object({ name: z.string() });
    const request = new Request("http://localhost", {
      method: "POST",
      body: "{",
    });

    const result = await parseJsonBody(request, schema);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(400);
      await expect(result.error.json()).resolves.toEqual({
        error: "Invalid JSON body.",
      });
    }
  });

  it("rejects invalid payloads", async () => {
    const schema = z.object({ name: z.string() });
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const result = await parseJsonBody(request, schema);
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(400);
      await expect(result.error.json()).resolves.toEqual({
        error: "Invalid payload.",
      });
    }
  });

  it("rejects payloads larger than max bytes", async () => {
    const schema = z.object({ name: z.string() });
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Ada" }),
    });

    const result = await parseJsonBody(request, schema, { maxBytes: 2 });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.error.status).toBe(413);
      await expect(result.error.json()).resolves.toEqual({
        error: "Request too long.",
      });
    }
  });

  it("builds standard error responses", async () => {
    const response = errorResponse("Bad", 400, {
      headers: { "x-test": "1" },
    });
    expect(response.status).toBe(400);
    expect(response.headers.get("x-test")).toBe("1");
    await expect(response.json()).resolves.toEqual({ error: "Bad" });
  });

  it("builds unauthorized and rate limit responses", async () => {
    const unauthorized = unauthorizedResponse();
    expect(unauthorized.status).toBe(401);
    await expect(unauthorized.json()).resolves.toEqual({
      error: "Unauthorized.",
    });

    const rateLimited = tooManyRequestsResponse(5);
    expect(rateLimited.status).toBe(429);
    expect(rateLimited.headers.get("Retry-After")).toBe("5");
    await expect(rateLimited.json()).resolves.toEqual({
      error: "Too many requests.",
    });
  });
});
