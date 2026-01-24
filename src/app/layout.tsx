import type { Metadata } from "next";
import { getServerSession } from "next-auth";

import Providers from "@/components/providers";
import SiteHeader from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { getEnv } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tech Career Readiness",
  description:
    "A self-paced roadmap for landing tech internships and early-career roles.",
};

export const dynamic = "force-dynamic";

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
  const env = getEnv();
  const analyticsFlag = env.NEXT_PUBLIC_ANALYTICS_ENABLED?.toLowerCase();
  const analyticsEnabled =
    analyticsFlag === "true" ||
    (analyticsFlag !== "false" && (env.isPreview || env.isProduction));

  return (
    <html lang="en">
      <body className="antialiased h-screen overflow-hidden relative">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers
          session={session}
          initialFocusKey={user?.focusKey ?? null}
          analyticsEnabled={analyticsEnabled}
        >
          <div className="flex h-full flex-col">
            <SiteHeader />
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
