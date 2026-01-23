import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const resetEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }
  Object.assign(process.env, ORIGINAL_ENV);
};

const importLogger = async () => {
  vi.resetModules();
  return import("@/lib/logger");
};

afterEach(() => {
  resetEnv();
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("redacts secrets and PII fields", async () => {
    process.env.LOG_LEVEL = "debug";

    const { logger } = await importLogger();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.info("test.log", {
      email: "user@example.com",
      token: "secret-token",
      nested: { password: "password" },
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(infoSpy.mock.calls[0][0]));
    expect(payload.email).toBe("[REDACTED]");
    expect(payload.token).toBe("[REDACTED]");
    expect(payload.nested.password).toBe("[REDACTED]");
  });

  it("respects log level filtering", async () => {
    process.env.LOG_LEVEL = "warn";

    const { logger } = await importLogger();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logger.info("test.info");
    logger.warn("test.warn");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("serializes error objects", async () => {
    process.env.LOG_LEVEL = "debug";

    const { logger } = await importLogger();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("test.error", { error: new Error("Boom") });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(errorSpy.mock.calls[0][0]));
    expect(payload.error.message).toBe("Boom");
    expect(payload.error.name).toBe("Error");
  });

  it("applies sampling to info/debug logs", async () => {
    process.env.LOG_LEVEL = "debug";
    process.env.LOG_SAMPLE_RATE = "0";

    const { logger } = await importLogger();
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logger.info("test.sampled");
    logger.warn("test.unsampled");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
