"use client";

import { Analytics } from "@vercel/analytics/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

import { FocusProvider } from "@/components/focus-provider";
import { ProgressProvider } from "@/components/progress-provider";
import type { FocusKey } from "@/lib/focus-options";

/**
 * Props for the global providers wrapper.
 */
type ProvidersProps = {
  children: ReactNode;
  session: Session | null;
  initialFocusKey?: FocusKey | null;
  analyticsEnabled?: boolean;
};

/**
 * Wrap application children with session and progress providers.
 *
 * @remarks
 * Centralizes provider setup for auth + progress without introducing additional
 * state.
 */
export default function Providers({
  children,
  session,
  initialFocusKey = null,
  analyticsEnabled = false,
}: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <FocusProvider initialFocusKey={initialFocusKey}>
        <ProgressProvider>
          {children}
          {analyticsEnabled ? <Analytics /> : null}
        </ProgressProvider>
      </FocusProvider>
    </SessionProvider>
  );
}
