"use client";

import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { FocusProvider } from "@/components/focus-provider";
import { ProgressProvider } from "@/components/progress-provider";
import type { Session } from "@/lib/auth-types";
import { reportClientError } from "@/lib/client-error";
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
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportClientError({
        message: event.message || "Unhandled client error",
        name: event.error?.name,
        stack: event.error?.stack,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const error = reason instanceof Error ? reason : new Error(String(reason ?? "Unknown"));
      reportClientError({
        message: error.message || "Unhandled promise rejection",
        name: error.name,
        stack: error.stack,
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

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
