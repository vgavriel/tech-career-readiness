import { afterEach, describe, expect, it } from "vitest";

import {
  buildDateVersion,
  formatVersionDate,
  normalizeShortSha,
  resolveBuildVersion,
} from "../build-version.mjs";

const ORIGINAL_GIT_DIR = process.env.GIT_DIR;

afterEach(() => {
  if (ORIGINAL_GIT_DIR === undefined) {
    delete process.env.GIT_DIR;
    return;
  }

  process.env.GIT_DIR = ORIGINAL_GIT_DIR;
});

describe("build version helpers", () => {
  it("formats the date segment in UTC", () => {
    const date = new Date("2026-05-11T23:59:00.000Z");

    expect(formatVersionDate(date)).toBe("2026.05.11");
  });

  it("builds a date-based version with a short commit suffix", () => {
    const date = new Date("2026-05-11T12:00:00.000Z");

    expect(
      buildDateVersion({
        date,
        sha: "ABCDEF0123456789",
      })
    ).toBe("2026.05.11.abcdef0");
  });

  it("normalizes missing or invalid SHAs to local", () => {
    expect(normalizeShortSha(undefined)).toBe("local");
    expect(normalizeShortSha("not-a-sha")).toBe("local");
  });

  it("prefers an explicitly provided app version", () => {
    expect(
      resolveBuildVersion({
        env: {
          APP_VERSION: "2026.05.10.7654321",
          NEXT_PUBLIC_APP_VERSION: "2026.05.11.abcdef0",
        },
        now: new Date("2026-05-12T00:00:00.000Z"),
      })
    ).toEqual({
      source: "env",
      version: "2026.05.11.abcdef0",
    });
  });

  it("ignores blank explicit app versions", () => {
    const version = resolveBuildVersion({
      env: {
        APP_VERSION: "2026.05.11.abcdef0",
        NEXT_PUBLIC_APP_VERSION: " ",
      },
      now: new Date("2026-05-12T00:00:00.000Z"),
    });

    expect(version).toEqual({
      source: "env",
      version: "2026.05.11.abcdef0",
    });
  });

  it("derives a version from commit metadata when no explicit version is set", () => {
    const version = resolveBuildVersion({
      env: {
        GITHUB_SHA: "0123456789abcdef0123456789abcdef01234567",
      },
      now: new Date("2026-05-12T00:00:00.000Z"),
    });

    expect(version.source).toBe("git");
    expect(version.version).toMatch(/^\d{4}\.\d{2}\.\d{2}\.0123456$/);
  });

  it("falls back to the clock when Git metadata is unavailable", () => {
    process.env.GIT_DIR = "/tmp/tech-career-readiness-missing-git-dir";

    expect(
      resolveBuildVersion({
        env: {},
        now: new Date("2026-05-12T00:00:00.000Z"),
      })
    ).toEqual({
      source: "clock",
      version: "2026.05.12.local",
    });
  });
});
