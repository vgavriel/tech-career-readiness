import { getServerSession } from "next-auth";
import type { ReactNode } from "react";

import Providers from "@/components/providers";
import SiteHeader from "@/components/site-header";
import { GA_MEASUREMENT_ID, isGoogleAnalyticsAllowed } from "@/lib/analytics";
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
 * The root layout's Suspense boundary lets session-dependent content stream
 * after the request-rendered document shell.
 */
export default async function AppShell({ children }: AppShellProps) {
  const session = await getServerSession(authOptions);
  const user = await getAuthenticatedUser(session);
  const env = getEnv();
  const analyticsFlag = env.NEXT_PUBLIC_ANALYTICS_ENABLED?.toLowerCase();
  const analyticsEnabled =
    analyticsFlag === "true" || (analyticsFlag !== "false" && (env.isPreview || env.isProduction));
  const gaMeasurementId = isGoogleAnalyticsAllowed({
    isProduction: env.isProduction,
    vercelEnv: env.VERCEL_ENV,
    flag: env.GOOGLE_ANALYTICS_ENABLED,
  })
    ? GA_MEASUREMENT_ID
    : null;

  return (
    <Providers
      session={session}
      initialFocusKey={user?.focusKey ?? null}
      analyticsEnabled={analyticsEnabled}
      gaMeasurementId={gaMeasurementId}
    >
      <div className="flex h-full flex-col overflow-hidden">
        <SiteHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </Providers>
  );
}
