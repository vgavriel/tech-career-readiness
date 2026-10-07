import "./globals.css";

import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import AppShell from "@/components/app-shell";
import ThemeInitializer from "@/components/theme-initializer";

export const metadata: Metadata = {
  title: "Tech Career Readiness",
  description: "A self-paced roadmap for landing tech internships and early-career roles.",
};

/**
 * Props for the root layout wrapper.
 */
type RootLayoutProps = {
  children: React.ReactNode;
};

/**
 * Renders the global app shell with fonts and a Suspense boundary.
 *
 * @remarks
 * Render HTML per request so Next.js can nonce its framework scripts using the
 * request CSP. AppShell still streams session-dependent content through Suspense.
 */
export default async function RootLayout({ children }: Readonly<RootLayoutProps>) {
  await connection();

  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <ThemeInitializer />
      </head>
      <body className="antialiased h-dvh overflow-hidden relative">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Suspense fallback={<div className="flex h-full flex-col" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
