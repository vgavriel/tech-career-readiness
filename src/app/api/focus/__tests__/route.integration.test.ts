import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";

const authMocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => authMocks.getServerSession(...args),
}));

const getFocusRoute = async () => await import("@/app/api/focus/route");

const makeJsonRequest = (
  url: string,
  body: unknown,
  options: { origin?: string } = {}
) => {
  const { origin = new URL(url).origin } = options;

  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
};

const makeRawJsonRequest = (
  url: string,
  body: string,
  options: { origin?: string } = {}
) => {
  const { origin = new URL(url).origin } = options;

  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body,
  });
};

beforeEach(() => {
  authMocks.getServerSession.mockReset();
});

describe("integration: /api/focus", () => {
  it("returns 401 when unauthenticated", async () => {
    authMocks.getServerSession.mockResolvedValue(null);

    const { GET, POST } = await getFocusRoute();

    const getResponse = await GET(new Request("http://localhost/api/focus"));
    expect(getResponse.status).toBe(401);

    const postResponse = await POST(
      makeJsonRequest("http://localhost/api/focus", { focusKey: "applying-soon" })
    );
    expect(postResponse.status).toBe(401);
  });

  it("rejects requests with invalid origin", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "focus-origin@example.com",
        name: "Focus Origin",
        image: null,
      },
    });

    const { POST } = await getFocusRoute();
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/focus",
        { focusKey: "applying-soon" },
        { origin: "http://evil.example.com" }
      )
    );

    expect(response.status).toBe(403);
  });

  it("rejects invalid focus keys", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "focus-invalid@example.com",
        name: "Focus Invalid",
        image: null,
      },
    });

    const { POST } = await getFocusRoute();
    const response = await POST(
      makeJsonRequest("http://localhost/api/focus", { focusKey: "not-a-focus" })
    );

    expect(response.status).toBe(400);
  });

  it("rejects malformed JSON payloads", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "focus-bad-json@example.com",
        name: "Bad Focus JSON",
        image: null,
      },
    });

    const { POST } = await getFocusRoute();
    const response = await POST(
      makeRawJsonRequest("http://localhost/api/focus", "{bad-json")
    );

    expect(response.status).toBe(400);
  });

  it("rejects payloads that exceed the body limit", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "focus-too-large@example.com",
        name: "Focus Too Large",
        image: null,
      },
    });

    const originalMaxBytes = process.env.MAX_JSON_BODY_BYTES;
    process.env.MAX_JSON_BODY_BYTES = "20";

    try {
      const { POST } = await getFocusRoute();
      const response = await POST(
        makeRawJsonRequest(
          "http://localhost/api/focus",
          JSON.stringify({
            focusKey: "just-starting",
            padding: "this payload is too large",
          })
        )
      );

      expect(response.status).toBe(413);
    } finally {
      if (originalMaxBytes === undefined) {
        delete process.env.MAX_JSON_BODY_BYTES;
      } else {
        process.env.MAX_JSON_BODY_BYTES = originalMaxBytes;
      }
    }
  });

  it("updates and returns the stored focus key", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "focus@example.com",
        name: "Focus User",
        image: null,
      },
    });

    const { GET, POST } = await getFocusRoute();

    const updateResponse = await POST(
      makeJsonRequest("http://localhost/api/focus", { focusKey: "applying-soon" })
    );

    expect(updateResponse.status).toBe(200);

    const user = await prisma.user.findUnique({
      where: { email: "focus@example.com" },
    });

    expect(user?.focusKey).toBe("applying-soon");

    const getResponse = await GET(new Request("http://localhost/api/focus"));
    const body = await getResponse.json();

    expect(body.focusKey).toBe("applying-soon");
  });
});
