import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const mocks = vi.hoisted(() => ({
  limitMock: vi.fn(),
  slidingWindowMock: vi.fn(() => ({ window: true })),
  constructorMock: vi.fn(),
  fromEnvMock: vi.fn(() => ({})),
}));

vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    static slidingWindow = mocks.slidingWindowMock;
    limit = mocks.limitMock;

    constructor(options: unknown) {
      mocks.constructorMock(options);
    }
  }

  return { Ratelimit };
});

vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: mocks.fromEnvMock,
  },
}));

const resetEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, ORIGINAL_ENV);
};

const importRateLimit = async () => {
  vi.resetModules();
  return import("@/lib/rate-limit");
};

beforeEach(() => {
  mocks.limitMock.mockReset();
  mocks.constructorMock.mockReset();
  mocks.fromEnvMock.mockReset();
  mocks.slidingWindowMock.mockReset();
  mocks.slidingWindowMock.mockImplementation(() => ({ window: true }));
});

afterEach(() => {
  resetEnv();
});

describe("enforceRateLimit", () => {
  it("skips rate limiting outside preview/prod", async () => {
    process.env.APP_ENV = "local";

    const { enforceRateLimit } = await importRateLimit();
    const response = await enforceRateLimit(
      new Request("http://localhost"),
      "lesson-content"
    );

    expect(response).toBeNull();
    expect(mocks.fromEnvMock).not.toHaveBeenCalled();
    expect(mocks.constructorMock).not.toHaveBeenCalled();
  });

  it("uses identifier and caches limiters in preview mode", async () => {
    process.env.APP_ENV = "preview";
    process.env.UPSTASH_REDIS_REST_URL = "https://example-redis.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    mocks.limitMock.mockResolvedValue({ success: true, reset: Date.now() + 1000 });

    const { enforceRateLimit } = await importRateLimit();
    const request = new Request("http://localhost");

    await enforceRateLimit(request, "progress-read", "  user-1  ");
    await enforceRateLimit(request, "progress-read", "user-1");

    expect(mocks.fromEnvMock).toHaveBeenCalledTimes(1);
    expect(mocks.constructorMock).toHaveBeenCalledTimes(1);
    expect(mocks.limitMock).toHaveBeenCalledWith("user-1");
  });

  it("returns 429 when the limiter rejects the request", async () => {
    process.env.APP_ENV = "preview";
    process.env.UPSTASH_REDIS_REST_URL = "https://example-redis.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";

    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(0);
    mocks.limitMock.mockResolvedValue({ success: false, reset: 1500 });

    const { enforceRateLimit } = await importRateLimit();
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "1.2.3.4, 5.6.7.8",
      },
    });

    const response = await enforceRateLimit(request, "lesson-content");

    expect(mocks.limitMock).toHaveBeenCalledWith("1.2.3.4");
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("2");
    await expect(response?.json()).resolves.toEqual({
      error: "Too many requests.",
    });

    nowSpy.mockRestore();
  });
});
