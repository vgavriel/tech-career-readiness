"use client";

import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

import { ProgressProvider } from "@/components/progress-provider";

/**
 * Props for the global providers wrapper.
 */
type ProvidersProps = {
  children: ReactNode;
  session: Session | null;
};

/**
 * Wrap application children with session and progress providers.
 *
 * @remarks
 * Centralizes provider setup for auth + progress without introducing additional
 * state.
 */
export default function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ProgressProvider>{children}</ProgressProvider>
    </SessionProvider>
  );
}
