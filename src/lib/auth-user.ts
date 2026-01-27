import type { Prisma } from "@prisma/client";
import { getServerSession, type Session } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { normalizeFocusKey } from "@/lib/focus-options";
import { prisma } from "@/lib/prisma";

/**
 * Minimal user data required for authenticated server-side flows.
 */
export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
  focusKey: ReturnType<typeof normalizeFocusKey>;
};

const userSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  isAdmin: true,
  focusKey: true,
} satisfies Prisma.UserSelect;

type DbUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

/**
 * Normalize comma-separated email lists to lowercase values.
 */
const normalizeEmailList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

const toAuthenticatedUser = (user: DbUser): AuthenticatedUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  image: user.image,
  isAdmin: user.isAdmin,
  focusKey: normalizeFocusKey(user.focusKey),
});

const isUniqueConstraintError = (error: unknown): error is { code: string } => {
  if (!error || typeof error !== "object") {
    return false;
  }

  if (!("code" in error)) {
    return false;
  }

  return (error as { code?: unknown }).code === "P2002";
};

/**
 * Fetch or create the signed-in user and return the normalized profile data.
 */
export async function getAuthenticatedUser(
  sessionOverride?: Session | null
): Promise<AuthenticatedUser | null> {
  const env = getEnv();
  const session =
    sessionOverride !== undefined ? sessionOverride : await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const normalizedEmail = email.toLowerCase();
  const allowAdminBootstrap = env.isLocal || env.isPreview || env.isTest;
  const adminEmails = allowAdminBootstrap ? normalizeEmailList(process.env.ADMIN_EMAILS) : [];
  const shouldBeAdmin = allowAdminBootstrap && adminEmails.includes(normalizedEmail);

  const sessionName = session.user?.name ?? undefined;
  const sessionImage = session.user?.image ?? undefined;

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: userSelect,
  });

  if (!existingUser) {
    try {
      const created = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: session.user?.name ?? null,
          image: session.user?.image ?? null,
          isAdmin: shouldBeAdmin,
        },
        select: userSelect,
      });
      return toAuthenticatedUser(created);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const fallbackUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: userSelect,
        });
        if (fallbackUser) {
          return toAuthenticatedUser(fallbackUser);
        }
      }
      throw error;
    }
  }

  const updateData: Prisma.UserUpdateInput = {};
  if (sessionName !== undefined && sessionName !== existingUser.name) {
    updateData.name = sessionName;
  }
  if (sessionImage !== undefined && sessionImage !== existingUser.image) {
    updateData.image = sessionImage;
  }
  if (shouldBeAdmin && !existingUser.isAdmin) {
    updateData.isAdmin = true;
  }

  if (Object.keys(updateData).length === 0) {
    return toAuthenticatedUser(existingUser);
  }

  const updated = await prisma.user.update({
    where: { id: existingUser.id },
    data: updateData,
    select: userSelect,
  });

  return toAuthenticatedUser(updated);
}
