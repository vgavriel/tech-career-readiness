import { describe, expect, it, vi } from "vitest";

const nextAuthMocks = vi.hoisted(() => {
  const handler = vi.fn();
  const nextAuth = vi.fn(() => handler);
  return { handler, nextAuth };
});

vi.mock("next-auth", () => ({
  default: nextAuthMocks.nextAuth,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  createRequestLogger: () => vi.fn(),
}));

describe("NextAuth route handlers", () => {
  it("wraps the shared NextAuth handler for GET and POST", async () => {
    const { authOptions } = await import("@/lib/auth");
    const route = await import("@/app/api/auth/[...nextauth]/route");

    expect(nextAuthMocks.nextAuth).toHaveBeenCalledWith(authOptions);
    expect(typeof route.GET).toBe("function");
    expect(typeof route.POST).toBe("function");

    const getRequest = new Request("https://example.com/api/auth/signin", {
      method: "GET",
    });
    const postRequest = new Request(
      "https://example.com/api/auth/callback/google",
      {
        method: "POST",
      }
    );
    const getContext = { params: { nextauth: ["signin"] } };
    const postContext = { params: { nextauth: ["callback", "google"] } };

    nextAuthMocks.handler.mockResolvedValue(new Response(null, { status: 200 }));

    await route.GET(getRequest, getContext);
    await route.POST(postRequest, postContext);

    expect(nextAuthMocks.handler).toHaveBeenCalledWith(getRequest, getContext);
    expect(nextAuthMocks.handler).toHaveBeenCalledWith(postRequest, postContext);
  });
});
