import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

/**
 * Restore process.env to its original snapshot for isolation.
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
 * Re-import the env module after resetting module state.
 */
const importEnv = async () => {
  vi.resetModules();
  return import("@/lib/env");
};

afterEach(() => {
  resetEnv();
});

describe("env helpers", () => {
  it("uses APP_ENV when set and exposes flags", async () => {
    process.env.APP_ENV = "preview";
    process.env.NODE_ENV = "development";

    const { getEnv } = await importEnv();
    const env = getEnv();

    expect(env.appEnv).toBe("preview");
    expect(env.isPreview).toBe(true);
    expect(env.isLocal).toBe(false);
    expect(env.isProduction).toBe(false);
    expect(env.isTest).toBe(false);
  });

  it("falls back to production when NODE_ENV is production", async () => {
    delete process.env.APP_ENV;
    process.env.NODE_ENV = "production";

    const { getEnv } = await importEnv();
    const env = getEnv();

    expect(env.appEnv).toBe("production");
    expect(env.isProduction).toBe(true);
  });

  it("falls back to test when NODE_ENV is test", async () => {
    delete process.env.APP_ENV;
    process.env.NODE_ENV = "test";

    const { getEnv } = await importEnv();
    const env = getEnv();

    expect(env.appEnv).toBe("test");
    expect(env.isTest).toBe(true);
  });

  it("falls back to local for non-test, non-production NODE_ENV", async () => {
    delete process.env.APP_ENV;
    process.env.NODE_ENV = "development";

    const { getEnv } = await importEnv();
    const env = getEnv();

    expect(env.appEnv).toBe("local");
    expect(env.isLocal).toBe(true);
  });

  it("throws on an invalid APP_ENV value", async () => {
    process.env.APP_ENV = "invalid";

    const { getEnv } = await importEnv();

    expect(() => getEnv()).toThrow();
  });

  it("requireEnv returns the value when provided", async () => {
    const { requireEnv } = await importEnv();

    expect(requireEnv("value", "TEST_ENV")).toBe("value");
  });

  it("requireEnv throws with a helpful message when missing", async () => {
    const { requireEnv } = await importEnv();

    expect(() => requireEnv(undefined, "MISSING_ENV")).toThrow(
      "Missing MISSING_ENV environment variable."
    );
  });

  it("caches env when not in test mode", async () => {
    process.env.APP_ENV = "local";
    process.env.NODE_ENV = "development";

    const { getEnv } = await importEnv();
    const first = getEnv();

    process.env.APP_ENV = "preview";
    const second = getEnv();

    expect(first.appEnv).toBe("local");
    expect(second.appEnv).toBe("local");
  });

  it("skips caching when APP_ENV is test", async () => {
    process.env.APP_ENV = "test";
    process.env.NODE_ENV = "development";

    const { getEnv } = await importEnv();
    const first = getEnv();

    process.env.APP_ENV = "local";
    const second = getEnv();

    expect(first.appEnv).toBe("test");
    expect(second.appEnv).toBe("local");
  });

  it("skips caching when NODE_ENV is test", async () => {
    process.env.APP_ENV = "local";
    process.env.NODE_ENV = "test";

    const { getEnv } = await importEnv();
    const first = getEnv();

    process.env.APP_ENV = "preview";
    const second = getEnv();

    expect(first.appEnv).toBe("local");
    expect(second.appEnv).toBe("preview");
  });
});
