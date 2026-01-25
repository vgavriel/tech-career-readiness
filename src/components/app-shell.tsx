import type { ReactNode } from "react";
import { getServerSession } from "next-auth";

import Providers from "@/components/providers";
import SiteHeader from "@/components/site-header";
import { authOptions } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { getEnv } from "@/lib/env";

type AppShellProps = {
  children: ReactNode;
};

/**
 * Server-rendered shell that owns runtime data and providers.
 *
 * @remarks
 * This component is wrapped in a Suspense boundary by the root layout to keep
 * runtime APIs compatible with cacheComponents.
 */
export default async function AppShell({ children }: AppShellProps) {
  const session = await getServerSession(authOptions);
  const user = await getAuthenticatedUser(session);
  const env = getEnv();
  const analyticsFlag = env.NEXT_PUBLIC_ANALYTICS_ENABLED?.toLowerCase();
  const analyticsEnabled =
    analyticsFlag === "true" ||
    (analyticsFlag !== "false" && (env.isPreview || env.isProduction));

  return (
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
  );
}
