import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

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

    await expect(importAuth()).rejects.toThrow(
      "Missing GOOGLE_CLIENT_ID environment variable."
    );
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

    await expect(importAuth()).rejects.toThrow(
      "Missing NEXTAUTH_SECRET environment variable."
    );
  });
});
