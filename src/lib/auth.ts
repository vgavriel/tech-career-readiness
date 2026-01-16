import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

import { devAuthDefaults } from "@/lib/dev-auth";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable.");
}

const isPlaceholder = (value?: string) => !value || value.startsWith("replace-with-");

const hasGoogleCredentials =
  !isPlaceholder(googleClientId) && !isPlaceholder(googleClientSecret);

const isProduction = process.env.NODE_ENV === "production";
if (!hasGoogleCredentials && isProduction) {
  if (isPlaceholder(googleClientId)) {
    throw new Error("Missing GOOGLE_CLIENT_ID environment variable.");
  }
  if (isPlaceholder(googleClientSecret)) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable.");
  }
}

const devAuthEmail = process.env.DEV_AUTH_EMAIL?.trim() || devAuthDefaults.email;
const devAuthName = process.env.DEV_AUTH_NAME?.trim() || devAuthDefaults.name;

const providers = hasGoogleCredentials
  ? [
      GoogleProvider({
        clientId: googleClientId as string,
        clientSecret: googleClientSecret as string,
      }),
    ]
  : [
      CredentialsProvider({
        name: "Dev Login",
        credentials: {
          email: { label: "Email", type: "email" },
          name: { label: "Name", type: "text" },
        },
        authorize: async (credentials) => ({
          id: devAuthDefaults.id,
          email: (credentials?.email as string | undefined) ?? devAuthEmail,
          name: (credentials?.name as string | undefined) ?? devAuthName,
        }),
      }),
    ];

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  secret: nextAuthSecret,
};
