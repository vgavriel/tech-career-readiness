import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROADMAP_MODULE_SELECT } from "@/lib/roadmap-types";

const cacheMocks = vi.hoisted(() => ({
  unstable_cache: vi.fn(<T>(callback: T) => callback),
}));

const prismaMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: cacheMocks.unstable_cache,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    module: {
      findMany: prismaMocks.findMany,
    },
  },
}));

describe("getRoadmapModules", () => {
  beforeEach(() => {
    vi.resetModules();
    cacheMocks.unstable_cache.mockClear();
    prismaMocks.findMany.mockReset();
    prismaMocks.findMany.mockResolvedValue([]);
  });

  it("configures a one-hour cache and returns ordered modules", async () => {
    const { getRoadmapModules } = await import("@/lib/roadmap-modules");

    const modules = [
      {
        id: "module-1",
        key: "intro",
        title: "Introduction",
        description: null,
        order: 1,
        lessons: [],
      },
    ];
    prismaMocks.findMany.mockResolvedValue(modules);

    await expect(getRoadmapModules()).resolves.toEqual(modules);

    expect(cacheMocks.unstable_cache).toHaveBeenCalledWith(
      expect.any(Function),
      ["roadmap-modules"],
      { revalidate: 60 * 60 }
    );
    expect(prismaMocks.findMany).toHaveBeenCalledWith({
      orderBy: { order: "asc" },
      select: ROADMAP_MODULE_SELECT,
    });
  });
});
