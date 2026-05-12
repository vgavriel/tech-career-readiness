import { NextResponse } from "next/server";

import { getAppVersion } from "@/lib/app-version";

/**
 * GET /api/version: expose the deployed app version for smoke tests and support.
 */
export function GET() {
  return NextResponse.json({
    version: getAppVersion(),
  });
}
