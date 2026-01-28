import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const redisMocks = vi.hoisted(() => ({
  fromEnv: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
}));

vi.mock("@upstash/redis", () => ({
  Redis: {
    fromEnv: (...args: unknown[]) => redisMocks.fromEnv(...args),
  },
}));

const mutableEnv = process.env as Record<string, string | undefined>;

const resetEnv = () => {
  for (const key of Object.keys(mutableEnv)) {
    if (!(key in ORIGINAL_ENV)) {
      delete mutableEnv[key];
    }
  }
  Object.assign(mutableEnv, ORIGINAL_ENV);
};

const importCache = async () => {
  vi.resetModules();
  return import("@/lib/lesson-content/cache");
};

beforeEach(() => {
  redisMocks.fromEnv.mockReset();
  redisMocks.get.mockReset();
  redisMocks.set.mockReset();
});

afterEach(() => {
  resetEnv();
  vi.restoreAllMocks();
});

describe("lesson-content-cache", () => {
  it("stores and returns in-memory entries", async () => {
    const { setLessonContentCache, getLessonContentCache, clearLessonContentCache } =
      await importCache();

    setLessonContentCache("lesson-1", "<p>Cached</p>", 1000, 0);

    await expect(getLessonContentCache("lesson-1", 500)).resolves.toBe("<p>Cached</p>");
    await expect(getLessonContentCache("lesson-1", 2000)).resolves.toBeNull();

    clearLessonContentCache();
    await expect(getLessonContentCache("lesson-1", 2500)).resolves.toBeNull();
  });

  it("uses Redis in production when configured", async () => {
    mutableEnv.NODE_ENV = "production";
    mutableEnv.APP_ENV = "production";
    mutableEnv.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    mutableEnv.UPSTASH_REDIS_REST_TOKEN = "token";

    redisMocks.fromEnv.mockReturnValue({
      get: redisMocks.get,
      set: redisMocks.set,
    });
    redisMocks.get.mockResolvedValue("<p>Redis</p>");
    redisMocks.set.mockResolvedValue("ok");

    const { getLessonContentCache, setLessonContentCache } = await importCache();

    await expect(getLessonContentCache("lesson-2", 0)).resolves.toBe("<p>Redis</p>");
    expect(redisMocks.fromEnv).toHaveBeenCalledTimes(1);
    expect(redisMocks.get).toHaveBeenCalledWith("lesson-content:v3:lesson-2");

    setLessonContentCache("lesson-2", "<p>Fresh</p>", 1000, 0);
    expect(redisMocks.set).toHaveBeenCalled();
  });
});
