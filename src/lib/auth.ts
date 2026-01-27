import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { devAuthDefaults } from "@/lib/dev-auth";
import { getEnv, requireEnv } from "@/lib/env";

const env = getEnv();
const nextAuthSecret = requireEnv(env.NEXTAUTH_SECRET, "NEXTAUTH_SECRET");

const devAuthEmail = env.DEV_AUTH_EMAIL?.trim() || devAuthDefaults.email;
const devAuthName = env.DEV_AUTH_NAME?.trim() || devAuthDefaults.name;

const isLocalAuth = env.isLocal || env.isTest;

const providers = isLocalAuth
  ? [
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
    ]
  : [
      GoogleProvider({
        clientId: requireEnv(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID"),
        clientSecret: requireEnv(env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET"),
      }),
    ];

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  secret: nextAuthSecret,
};
