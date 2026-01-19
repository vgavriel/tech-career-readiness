import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";

const authMocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => authMocks.getServerSession(...args),
}));

/**
 * Import the progress route handlers for integration tests.
 */
const getProgressRoute = async () => await import("@/app/api/progress/route");
/**
 * Import the progress merge route handler for integration tests.
 */
const getMergeRoute = async () => await import("@/app/api/progress/merge/route");

/**
 * Build a JSON POST request with an optional Origin header.
 */
const makeJsonRequest = (
  url: string,
  body: unknown,
  options: { origin?: string } = {}
) => {
  const { origin = new URL(url).origin } = options;

  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
};

beforeEach(() => {
  authMocks.getServerSession.mockReset();
});

describe("integration: /api/progress", () => {
  it("returns 401 when unauthenticated", async () => {
    authMocks.getServerSession.mockResolvedValue(null);

    const { POST } = await getProgressRoute();
    const response = await POST(
      makeJsonRequest("http://localhost/api/progress", {
        lessonSlug: "lesson-slug",
        completed: true,
      })
    );

    expect(response.status).toBe(401);
  });

  it("rejects requests with invalid origin", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "progress-origin@example.com",
        name: "Origin Test",
        image: null,
      },
    });

    const { POST } = await getProgressRoute();
    const response = await POST(
      makeJsonRequest(
        "http://localhost/api/progress",
        {
          lessonSlug: "lesson-slug",
          completed: true,
        },
        { origin: "http://evil.example.com" }
      )
    );

    expect(response.status).toBe(403);
  });

  it("rejects non-string lessonSlug payloads", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "progress-invalid@example.com",
        name: "Invalid Progress",
        image: null,
      },
    });

    const { POST } = await getProgressRoute();
    const response = await POST(
      makeJsonRequest("http://localhost/api/progress", {
        lessonSlug: 123,
        completed: true,
      })
    );

    expect(response.status).toBe(400);
  });

  it("marks a lesson complete and incomplete", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "progress@example.com",
        name: "Progress User",
        image: null,
      },
    });

    const lesson = await prisma.lesson.findFirst({
      select: { id: true, slug: true },
    });

    expect(lesson).not.toBeNull();
    if (!lesson) {
      return;
    }

    const { POST } = await getProgressRoute();

    const completeResponse = await POST(
      makeJsonRequest("http://localhost/api/progress", {
        lessonSlug: lesson.slug,
        completed: true,
      })
    );

    expect(completeResponse.status).toBe(200);

    const user = await prisma.user.findUnique({
      where: { email: "progress@example.com" },
    });

    expect(user).not.toBeNull();
    if (!user) {
      return;
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
    });

    expect(progress?.completedAt).not.toBeNull();

    const completionEvent = await prisma.lessonProgressEvent.findFirst({
      where: {
        userId: user.id,
        lessonId: lesson.id,
        action: "completed",
      },
    });

    expect(completionEvent).not.toBeNull();

    const incompleteResponse = await POST(
      makeJsonRequest("http://localhost/api/progress", {
        lessonSlug: lesson.slug,
        completed: false,
      })
    );

    expect(incompleteResponse.status).toBe(200);

    const progressAfter = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
    });

    expect(progressAfter).toBeNull();

    const incompleteEvent = await prisma.lessonProgressEvent.findFirst({
      where: {
        userId: user.id,
        lessonId: lesson.id,
        action: "incomplete",
      },
    });

    expect(incompleteEvent).not.toBeNull();
  });

  it("returns completed lesson slugs for the authenticated user", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "progress-get@example.com",
        name: "Progress Getter",
        image: null,
      },
    });

    const lesson = await prisma.lesson.findFirst({
      select: { id: true, slug: true },
    });

    expect(lesson).not.toBeNull();
    if (!lesson) {
      return;
    }

    const { POST, GET } = await getProgressRoute();

    await POST(
      makeJsonRequest("http://localhost/api/progress", {
        lessonSlug: lesson.slug,
        completed: true,
      })
    );

    const response = await GET(new Request("http://localhost/api/progress"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.completedLessonSlugs).toContain(lesson.slug);
  });
});

describe("integration: /api/progress/merge", () => {
  it("merges guest progress entries", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "progress-merge@example.com",
        name: "Merge User",
        image: null,
      },
    });

    const lesson = await prisma.lesson.findFirst({
      select: { id: true, slug: true },
    });

    expect(lesson).not.toBeNull();
    if (!lesson) {
      return;
    }

    const { POST } = await getMergeRoute();

    const response = await POST(
      makeJsonRequest("http://localhost/api/progress/merge", {
        lessonSlugs: [lesson.slug, "missing-lesson", " "],
      })
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.mergedLessonSlugs).toEqual([lesson.slug]);

    const user = await prisma.user.findUnique({
      where: { email: "progress-merge@example.com" },
    });

    expect(user).not.toBeNull();
    if (!user) {
      return;
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
    });

    expect(progress?.completedAt).not.toBeNull();

    const mergeEvent = await prisma.lessonProgressEvent.findFirst({
      where: {
        userId: user.id,
        lessonId: lesson.id,
        action: "completed",
      },
    });

    expect(mergeEvent).not.toBeNull();
  });
});
