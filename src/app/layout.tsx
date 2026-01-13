import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { getServerSession } from "next-auth";

import Providers from "@/components/providers";
import SiteHeader from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

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

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        <Providers session={session}>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
