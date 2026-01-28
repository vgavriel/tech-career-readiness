import { describe, expect, it } from "vitest";

const getRoute = async () => {
  const route = await import("@/app/api/client-error/route");
  return route.POST;
};

const makeRequest = (body: string, headers: HeadersInit = {}) =>
  new Request("http://localhost/api/client-error", {
    method: "POST",
    headers,
    body,
  });

describe("POST /api/client-error", () => {
  it("accepts a valid error payload", async () => {
    const POST = await getRoute();
    const response = await POST(
      makeRequest(JSON.stringify({ message: "Boom" }), {
        "content-type": "application/json",
        origin: "http://localhost",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("rejects invalid payloads", async () => {
    const POST = await getRoute();
    const response = await POST(
      makeRequest("{}", {
        "content-type": "application/json",
        origin: "http://localhost",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid payload.",
    });
  });

  it("rejects missing origin", async () => {
    const POST = await getRoute();
    const response = await POST(
      makeRequest(JSON.stringify({ message: "Boom" }), {
        "content-type": "application/json",
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Origin required.",
    });
  });

  it("rejects unsupported content types", async () => {
    const POST = await getRoute();
    const response = await POST(
      makeRequest("Boom", {
        "content-type": "text/plain",
        origin: "http://localhost",
      })
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      error: "Unsupported content type.",
    });
  });
});
