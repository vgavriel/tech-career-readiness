import type { Session } from "next-auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
};

const getEnvMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/env", () => ({
  getEnv: getEnvMock,
  requireEnv: (value: string | undefined) => value ?? "test-secret",
}));

const getModule = async () => import("@/lib/auth-user");

const baseUser = {
  id: "user-1",
  email: "student@example.com",
  name: "Student",
  image: "avatar",
  isAdmin: false,
  focusKey: "just-starting",
  sessionVersion: 0,
};

const baseEnv = {
  isPreview: false,
  isTest: false,
  isLocal: false,
  NEXTAUTH_SECRET: "test-secret",
  GOOGLE_CLIENT_ID: "test-client-id",
  GOOGLE_CLIENT_SECRET: "test-client-secret",
  DEV_AUTH_EMAIL: "dev@example.com",
  DEV_AUTH_NAME: "Dev User",
};

const makeEnv = (overrides: Partial<typeof baseEnv> = {}) => ({
  ...baseEnv,
  ...overrides,
});

const makeSession = (overrides: Partial<Session> = {}): Session =>
  ({
    user: {
      email: baseUser.email,
      name: baseUser.name,
      image: baseUser.image,
      sessionVersion: baseUser.sessionVersion,
    },
    ...overrides,
  }) as Session;

const originalAdminEmails = process.env.ADMIN_EMAILS;

beforeEach(() => {
  prismaMock.user.findUnique.mockReset();
  prismaMock.user.create.mockReset();
  prismaMock.user.update.mockReset();
  getEnvMock.mockReset();
  getEnvMock.mockReturnValue(makeEnv());
  process.env.ADMIN_EMAILS = originalAdminEmails;
});

afterEach(() => {
  if (originalAdminEmails === undefined) {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  }
});

describe("getAuthenticatedUser", () => {
  it("returns null when session has no email", async () => {
    const { getAuthenticatedUser } = await getModule();
    const session = { user: {} } as Session;

    const result = await getAuthenticatedUser(session);

    expect(result).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("creates the user when missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser);

    const { getAuthenticatedUser } = await getModule();
    const result = await getAuthenticatedUser(makeSession());

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          email: baseUser.email,
          name: baseUser.name,
          image: baseUser.image,
          isAdmin: false,
        },
      })
    );
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: baseUser.id,
      email: baseUser.email,
      name: baseUser.name,
      image: baseUser.image,
      isAdmin: false,
      focusKey: baseUser.focusKey,
    });
  });

  it("avoids updates when there are no changes", async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);

    const { getAuthenticatedUser } = await getModule();
    const result = await getAuthenticatedUser(makeSession());

    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(result?.name).toBe(baseUser.name);
  });

  it("promotes admin when allowlist matches", async () => {
    process.env.ADMIN_EMAILS = baseUser.email;
    getEnvMock.mockReturnValue(makeEnv({ isPreview: true }));
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    prismaMock.user.update.mockResolvedValue({
      ...baseUser,
      isAdmin: true,
    });

    const { getAuthenticatedUser } = await getModule();
    const result = await getAuthenticatedUser(makeSession());

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: baseUser.id },
        data: { isAdmin: true },
      })
    );
    expect(result?.isAdmin).toBe(true);
  });

  it("promotes admin when allowlist matches in local env", async () => {
    process.env.ADMIN_EMAILS = baseUser.email;
    getEnvMock.mockReturnValue(makeEnv({ isLocal: true }));
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    prismaMock.user.update.mockResolvedValue({
      ...baseUser,
      isAdmin: true,
    });

    const { getAuthenticatedUser } = await getModule();
    const result = await getAuthenticatedUser(makeSession());

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: baseUser.id },
        data: { isAdmin: true },
      })
    );
    expect(result?.isAdmin).toBe(true);
  });

  it("updates profile fields when they change", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      name: "Old Name",
      image: "old-avatar",
    });
    prismaMock.user.update.mockResolvedValue(baseUser);

    const { getAuthenticatedUser } = await getModule();
    const result = await getAuthenticatedUser(makeSession());

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: baseUser.name,
          image: baseUser.image,
        },
      })
    );
    expect(result?.name).toBe(baseUser.name);
  });

  it("handles unique constraint races when creating users", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(baseUser);
    prismaMock.user.create.mockRejectedValue({ code: "P2002" });

    const { getAuthenticatedUser } = await getModule();
    const result = await getAuthenticatedUser(makeSession());

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(2);
    expect(result?.email).toBe(baseUser.email);
  });

  it("returns null when the session version is stale", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...baseUser,
      sessionVersion: 2,
    });

    const { getAuthenticatedUser } = await getModule();
    const result = await getAuthenticatedUser(
      makeSession({
        user: {
          email: baseUser.email,
          name: baseUser.name,
          image: baseUser.image,
          sessionVersion: 1,
        },
      })
    );

    expect(result).toBeNull();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});
