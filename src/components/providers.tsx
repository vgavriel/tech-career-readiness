"use client";

import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

import { ProgressProvider } from "@/components/progress-provider";

type ProvidersProps = {
  children: ReactNode;
  session: Session | null;
};

export default function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ProgressProvider>{children}</ProgressProvider>
    </SessionProvider>
  );
}
