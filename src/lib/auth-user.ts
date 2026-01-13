import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
};

const normalizeEmailList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return null;
  }

  const normalizedEmail = email.toLowerCase();
  const adminEmails = normalizeEmailList(process.env.ADMIN_EMAILS);
  const shouldBeAdmin = adminEmails.includes(normalizedEmail);

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
