import type { NextAuthOptions } from "next-auth";
import { afterEach, describe, expect, it, vi } from "vitest";

import { devAuthDefaults } from "@/lib/dev-auth";

const ORIGINAL_ENV = { ...process.env };
const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
};

type AuthCallbacks = NonNullable<NextAuthOptions["callbacks"]>;
type JwtCallback = NonNullable<AuthCallbacks["jwt"]>;
type JwtParams = Parameters<JwtCallback>[0];
type SessionCallback = NonNullable<AuthCallbacks["session"]>;
type SessionParams = Parameters<SessionCallback>[0];

vi.mock("next-auth/providers/google", () => ({
  default: (config: { clientId: string; clientSecret: string }) => ({
    id: "google",
    ...config,
  }),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (config: { name: string }) => ({
    id: "credentials",
    ...config,
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

/**
 * Restore process.env to its original snapshot.
 */
const resetEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, ORIGINAL_ENV);
};

/**
 * Re-import the auth module after resetting mocked modules.
 */
const importAuth = async () => {
  vi.resetModules();
  return import("@/lib/auth");
};

describe("authOptions", () => {
  afterEach(() => {
    resetEnv();
    prismaMock.user.findUnique.mockReset();
  });

  it("builds Google auth options in preview", async () => {
    process.env.APP_ENV = "preview";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.NEXTAUTH_SECRET = "auth-secret";

    const { authOptions } = await importAuth();

    expect(authOptions.session?.strategy).toBe("jwt");
    expect(authOptions.secret).toBe("auth-secret");

    const provider = authOptions.providers?.[0] as {
      clientId: string;
      clientSecret: string;
    };

    expect(provider.clientId).toBe("client-id");
    expect(provider.clientSecret).toBe("client-secret");
  });

  it("uses credentials provider in local", async () => {
    process.env.APP_ENV = "local";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.NEXTAUTH_SECRET = "auth-secret";

    const { authOptions } = await importAuth();
    const provider = authOptions.providers?.[0] as { id: string };

    expect(provider.id).toBe("credentials");
  });

  it("throws when GOOGLE_CLIENT_ID is missing in preview", async () => {
    process.env.APP_ENV = "preview";
    delete process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.NEXTAUTH_SECRET = "auth-secret";

    await expect(importAuth()).rejects.toThrow("Missing GOOGLE_CLIENT_ID environment variable.");
  });

  it("throws when GOOGLE_CLIENT_SECRET is missing in preview", async () => {
    process.env.APP_ENV = "preview";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    delete process.env.GOOGLE_CLIENT_SECRET;
    process.env.NEXTAUTH_SECRET = "auth-secret";

    await expect(importAuth()).rejects.toThrow(
      "Missing GOOGLE_CLIENT_SECRET environment variable."
    );
  });

  it("throws when NEXTAUTH_SECRET is missing", async () => {
    process.env.APP_ENV = "local";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    delete process.env.NEXTAUTH_SECRET;

    await expect(importAuth()).rejects.toThrow("Missing NEXTAUTH_SECRET environment variable.");
  });

  it("authorizes credential sign-in payloads in local", async () => {
    process.env.APP_ENV = "local";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.NEXTAUTH_SECRET = "auth-secret";

    const { authOptions } = await importAuth();
    const provider = authOptions.providers?.[0] as unknown as {
      authorize: (credentials?: Record<string, string>) => Promise<{
        id: string;
        email?: string;
        name?: string;
      }>;
    };

    const result = await provider.authorize({
      email: "student@example.com",
      name: "Student Name",
    });

    expect(result).toEqual({
      id: devAuthDefaults.id,
      email: "student@example.com",
      name: "Student Name",
    });
  });

  it("hydrates sessionVersion in the jwt callback when missing", async () => {
    process.env.APP_ENV = "preview";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.NEXTAUTH_SECRET = "auth-secret";

    prismaMock.user.findUnique.mockResolvedValue({ sessionVersion: 2 });

    const { authOptions } = await importAuth();

    const jwtCallback = authOptions.callbacks?.jwt;
    if (!jwtCallback) {
      throw new Error("Expected jwt callback to be defined.");
    }
    const token = await jwtCallback({
      token: { email: "student@example.com" },
      user: { id: "user-1", email: "student@example.com" },
      account: null,
      profile: undefined,
      isNewUser: false,
    } as JwtParams);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "student@example.com" },
      select: { sessionVersion: true },
    });
    expect(token?.sessionVersion).toBe(2);
  });

  it("defaults sessionVersion to 0 when no email is available", async () => {
    process.env.APP_ENV = "preview";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.NEXTAUTH_SECRET = "auth-secret";

    const { authOptions } = await importAuth();

    const jwtCallback = authOptions.callbacks?.jwt;
    if (!jwtCallback) {
      throw new Error("Expected jwt callback to be defined.");
    }
    const token = await jwtCallback({
      token: {},
      account: null,
      profile: undefined,
      isNewUser: false,
    } as JwtParams);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(token?.sessionVersion).toBe(0);
  });

  it("does not re-fetch when the token already has a sessionVersion", async () => {
    process.env.APP_ENV = "preview";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.NEXTAUTH_SECRET = "auth-secret";

    const { authOptions } = await importAuth();

    const jwtCallback = authOptions.callbacks?.jwt;
    if (!jwtCallback) {
      throw new Error("Expected jwt callback to be defined.");
    }
    const token = await jwtCallback({
      token: { email: "student@example.com", sessionVersion: 4 },
      account: null,
      profile: undefined,
      isNewUser: false,
    } as JwtParams);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(token?.sessionVersion).toBe(4);
  });

  it("hydrates session.user.sessionVersion in the session callback", async () => {
    process.env.APP_ENV = "preview";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    process.env.NEXTAUTH_SECRET = "auth-secret";

    const { authOptions } = await importAuth();

    const sessionCallback = authOptions.callbacks?.session;
    if (!sessionCallback) {
      throw new Error("Expected session callback to be defined.");
    }
    const session = await sessionCallback({
      session: {
        user: { name: "Student" },
        expires: "2099-01-01T00:00:00.000Z",
      },
      token: { sessionVersion: 5 },
      newSession: undefined,
      trigger: "update",
    } as SessionParams);

    expect((session as { user?: { sessionVersion?: number } })?.user?.sessionVersion).toBe(5);
  });
});
