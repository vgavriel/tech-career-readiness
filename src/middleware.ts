import { NextResponse, type NextRequest } from "next/server";

import { REQUEST_ID_HEADER } from "@/lib/request-id";

export const config = {
  matcher: ["/api/:path*"],
};

/**
 * Attach a request id header for server routes and propagate it downstream.
 */
export function middleware(request: NextRequest) {
  const existingId = request.headers.get(REQUEST_ID_HEADER);
  const requestId = existingId?.trim() || crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);

  return response;
}
