import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_APP_VERSION, getAppVersion } from "@/lib/app-version";

const ORIGINAL_ENV = { ...process.env };
const mutableEnv = process.env as Record<string, string | undefined>;

const resetEnv = () => {
  for (const key of Object.keys(mutableEnv)) {
    if (!(key in ORIGINAL_ENV)) {
      delete mutableEnv[key];
    }
  }
  Object.assign(mutableEnv, ORIGINAL_ENV);
};

afterEach(() => {
  resetEnv();
});

describe("app version", () => {
  it("uses the public build version when available", () => {
    mutableEnv.NEXT_PUBLIC_APP_VERSION = "2026.05.11.abcdef0";
    mutableEnv.APP_VERSION = "2026.05.10.1234567";

    expect(getAppVersion()).toBe("2026.05.11.abcdef0");
  });

  it("falls back to APP_VERSION", () => {
    delete mutableEnv.NEXT_PUBLIC_APP_VERSION;
    mutableEnv.APP_VERSION = "2026.05.11.abcdef0";

    expect(getAppVersion()).toBe("2026.05.11.abcdef0");
  });

  it("ignores blank version values", () => {
    mutableEnv.NEXT_PUBLIC_APP_VERSION = " ";
    mutableEnv.APP_VERSION = "2026.05.11.abcdef0";

    expect(getAppVersion()).toBe("2026.05.11.abcdef0");
  });

  it("falls back to dev when no build version is set", () => {
    delete mutableEnv.NEXT_PUBLIC_APP_VERSION;
    delete mutableEnv.APP_VERSION;

    expect(getAppVersion()).toBe(DEFAULT_APP_VERSION);
  });
});
