import type { Metadata } from "next";
import { Suspense } from "react";

import AppShell from "@/components/app-shell";
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
 * Renders the global app shell with fonts and a Suspense boundary.
 *
 * @remarks
 * Runtime data access is delegated to AppShell to keep the layout static for
 * cacheComponents compatibility.
 */
export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en">
      <body className="antialiased h-screen overflow-hidden relative">
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
