import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  lesson: {
    findUnique: vi.fn(),
  },
  lessonSlugAlias: {
    findUnique: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

/**
 * Import the lesson slug module for testing.
 */
const getModule = async () => import("@/lib/lesson-slug");

const baseLesson = {
  id: "lesson-1",
  key: "lesson-1",
  title: "Lesson 1",
  slug: "lesson-1",
  order: 1,
  moduleId: "module-1",
  publishedUrl: "https://docs.google.com/document/d/e/lesson-1/pub",
  estimatedMinutes: 20,
  objectivesMarkdown: "- Build a roadmap",
  isArchived: false,
  supersededBy: null,
  module: {
    title: "Module 1",
    order: 1,
  },
};

const makeLesson = (overrides: Partial<typeof baseLesson> = {}) => ({
  ...baseLesson,
  ...overrides,
});

describe("findLessonBySlug", () => {
  beforeEach(() => {
    prismaMock.lesson.findUnique.mockReset();
    prismaMock.lessonSlugAlias.findUnique.mockReset();
  });

  it("returns the canonical lesson when the slug matches", async () => {
    const lesson = makeLesson({ slug: "canonical-slug" });
    prismaMock.lesson.findUnique.mockResolvedValue(lesson);

    const { findLessonBySlug } = await getModule();
    const result = await findLessonBySlug("canonical-slug");

    expect(result).toEqual({ lesson, isAlias: false });
    expect(prismaMock.lesson.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "canonical-slug" } })
    );
    expect(prismaMock.lessonSlugAlias.findUnique).not.toHaveBeenCalled();
  });

  it("returns the aliased lesson when canonical slug is missing", async () => {
    const lesson = makeLesson({ slug: "new-slug" });
    prismaMock.lesson.findUnique.mockResolvedValue(null);
    prismaMock.lessonSlugAlias.findUnique.mockResolvedValue({ lesson });

    const { findLessonBySlug } = await getModule();
    const result = await findLessonBySlug("old-slug");

    expect(result).toEqual({ lesson, isAlias: true });
    expect(prismaMock.lessonSlugAlias.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "old-slug" } })
    );
  });

  it("returns null when no canonical or alias match exists", async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);
    prismaMock.lessonSlugAlias.findUnique.mockResolvedValue(null);

    const { findLessonBySlug } = await getModule();
    const result = await findLessonBySlug("missing-slug");

    expect(result).toEqual({ lesson: null, isAlias: false });
  });
});

describe("buildLessonRedirectPath", () => {
  it("returns the canonical path without search params", async () => {
    const { buildLessonRedirectPath } = await getModule();

    expect(buildLessonRedirectPath("lesson-1")).toBe("/lesson/lesson-1");
  });

  it("preserves query parameters and repeated keys", async () => {
    const { buildLessonRedirectPath } = await getModule();

    const path = buildLessonRedirectPath("lesson-2", {
      ref: "email",
      tags: ["prep", "interview"],
      empty: "",
      skip: undefined,
    });

    expect(path).toBe(
      "/lesson/lesson-2?ref=email&tags=prep&tags=interview&empty="
    );
  });
});
