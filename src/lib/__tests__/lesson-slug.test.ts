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
 * Import the lesson slug helper for testing.
 */
const getHelper = async () => {
  const module = await import("@/lib/lesson-slug");
  return module.findLessonBySlug;
};

const baseLesson = {
  id: "lesson-1",
  title: "Lesson 1",
  slug: "lesson-1",
  order: 1,
  moduleId: "module-1",
  publishedUrl: "https://docs.google.com/document/d/e/lesson-1/pub",
  estimatedMinutes: 20,
  objectivesMarkdown: "- Build a roadmap",
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

    const findLessonBySlug = await getHelper();
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

    const findLessonBySlug = await getHelper();
    const result = await findLessonBySlug("old-slug");

    expect(result).toEqual({ lesson, isAlias: true });
    expect(prismaMock.lessonSlugAlias.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "old-slug" } })
    );
  });

  it("returns null when no canonical or alias match exists", async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);
    prismaMock.lessonSlugAlias.findUnique.mockResolvedValue(null);

    const findLessonBySlug = await getHelper();
    const result = await findLessonBySlug("missing-slug");

    expect(result).toEqual({ lesson: null, isAlias: false });
  });
});
