import { afterEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/version/route";

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

describe("GET /api/version", () => {
  it("returns the current app version", async () => {
    mutableEnv.NEXT_PUBLIC_APP_VERSION = "2026.05.11.abcdef0";

    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      version: "2026.05.11.abcdef0",
    });
  });
});
