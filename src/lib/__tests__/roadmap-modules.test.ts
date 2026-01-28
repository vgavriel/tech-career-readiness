import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  cacheLife: vi.fn(),
}));

const prismaMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cacheLife: cacheMocks.cacheLife,
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
    cacheMocks.cacheLife.mockReset();
    prismaMocks.findMany.mockReset();
    prismaMocks.findMany.mockResolvedValue([]);
  });

  it("configures a one-hour cache and returns ordered modules", async () => {
    const { getRoadmapModules } = await import("@/lib/roadmap-modules");

    await getRoadmapModules();

    expect(cacheMocks.cacheLife).toHaveBeenCalledWith({ revalidate: 60 * 60 });
    expect(prismaMocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { order: "asc" },
        select: expect.objectContaining({
          lessons: expect.objectContaining({
            orderBy: { order: "asc" },
          }),
        }),
      })
    );
  });
});
