import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import Providers from "@/components/providers";
import SiteHeader from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Career Readiness",
  description:
    "A self-paced roadmap for landing tech internships and early-career roles.",
};

/**
 * Props for the root layout wrapper.
 */
type RootLayoutProps = {
  children: React.ReactNode;
};

/**
 * Renders the global app shell with fonts, auth session, and providers.
 *
 * @remarks
 * Fetches the server session once and wraps the tree with providers plus the
 * global header; no client state.
 */
export default async function RootLayout({
  children,
}: Readonly<RootLayoutProps>) {
  const session = await getServerSession(authOptions);
  const user = await getAuthenticatedUser(session);

  return (
    <html lang="en">
      <body className="antialiased">
        <Providers session={session} initialFocusKey={user?.focusKey ?? null}>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
