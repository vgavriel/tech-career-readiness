import { describe, expect, it, vi } from "vitest";

const nextAuthMocks = vi.hoisted(() => {
  const handler = vi.fn();
  const nextAuth = vi.fn(() => handler);
  return { handler, nextAuth };
});

vi.mock("next-auth", () => ({
  default: nextAuthMocks.nextAuth,
}));

describe("NextAuth route handlers", () => {
  it("exports GET and POST handlers from the same NextAuth instance", async () => {
    const { authOptions } = await import("@/lib/auth");
    const route = await import("@/app/api/auth/[...nextauth]/route");

    expect(nextAuthMocks.nextAuth).toHaveBeenCalledWith(authOptions);
    expect(route.GET).toBe(nextAuthMocks.handler);
    expect(route.POST).toBe(nextAuthMocks.handler);
  });
});
