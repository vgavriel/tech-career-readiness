import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";

const authMocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => authMocks.getServerSession(...args),
}));

const getProgressRoute = async () => await import("@/app/api/progress/route");
const getMergeRoute = async () => await import("@/app/api/progress/merge/route");

const makeJsonRequest = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  authMocks.getServerSession.mockReset();
});

describe("integration: /api/progress", () => {
  it("returns 401 when unauthenticated", async () => {
    authMocks.getServerSession.mockResolvedValue(null);

    const { POST } = await getProgressRoute();
    const response = await POST(
      makeJsonRequest("http://localhost/api/progress", {
        lessonId: "lesson-id",
        completed: true,
      })
    );

    expect(response.status).toBe(401);
  });

  it("rejects non-string lessonId payloads", async () => {
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
        lessonId: 123,
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
      select: { id: true },
    });

    expect(lesson).not.toBeNull();
    if (!lesson) {
      return;
    }

    const { POST } = await getProgressRoute();

    const completeResponse = await POST(
      makeJsonRequest("http://localhost/api/progress", {
        lessonId: lesson.id,
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

    const incompleteResponse = await POST(
      makeJsonRequest("http://localhost/api/progress", {
        lessonId: lesson.id,
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
  });

  it("returns completed lesson ids for the authenticated user", async () => {
    authMocks.getServerSession.mockResolvedValue({
      user: {
        email: "progress-get@example.com",
        name: "Progress Getter",
        image: null,
      },
    });

    const lesson = await prisma.lesson.findFirst({
      select: { id: true },
    });

    expect(lesson).not.toBeNull();
    if (!lesson) {
      return;
    }

    const { POST, GET } = await getProgressRoute();

    await POST(
      makeJsonRequest("http://localhost/api/progress", {
        lessonId: lesson.id,
        completed: true,
      })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.completedLessonIds).toContain(lesson.id);
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
      select: { id: true },
    });

    expect(lesson).not.toBeNull();
    if (!lesson) {
      return;
    }

    const { POST } = await getMergeRoute();

    const response = await POST(
      makeJsonRequest("http://localhost/api/progress/merge", {
        entries: [
          { lessonId: lesson.id, completedAt: new Date().toISOString() },
          { lessonId: "missing-lesson", completedAt: new Date().toISOString() },
          { lessonId: 123, completedAt: new Date().toISOString() },
        ],
      })
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.mergedLessonIds).toEqual([lesson.id]);

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
  });
});
