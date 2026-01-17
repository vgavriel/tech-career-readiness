import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getEnv } from "@/lib/env";
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
};

/**
 * Normalize comma-separated email lists to lowercase values.
 */
const normalizeEmailList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

/**
 * Fetch or create the signed-in user and return the normalized profile data.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const env = getEnv();
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const normalizedEmail = email.toLowerCase();
  const allowAdminBootstrap = env.isLocal || env.isTest;
  const adminEmails = allowAdminBootstrap
    ? normalizeEmailList(process.env.ADMIN_EMAILS)
    : [];
  const shouldBeAdmin = allowAdminBootstrap && adminEmails.includes(normalizedEmail);

  // TODO: need an upsert every time?
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: session.user?.name ?? null,
      image: session.user?.image ?? null,
      isAdmin: shouldBeAdmin,
    },
    update: {
      name: session.user?.name ?? undefined,
      image: session.user?.image ?? undefined,
      ...(shouldBeAdmin ? { isAdmin: true } : {}),
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    isAdmin: user.isAdmin,
  };
}
