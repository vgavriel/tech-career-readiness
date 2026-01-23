import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-id";

/**
 * Create a shared NextAuth handler for GET and POST routes.
 */
const handler = NextAuth(authOptions);

const logAuthRequest = async (request: Request) => {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  const { pathname } = new URL(request.url);
  const segments = pathname.split("/").filter(Boolean);
  const action = segments[2] ?? "unknown";
  const provider = segments[3];

  try {
    const response = await handler(request);
    logger.info("auth.request", {
      requestId,
      route: "api/auth",
      action,
      provider,
      method: request.method,
      status: response.status,
      durationMs: Date.now() - startedAt,
    });
    return response;
  } catch (error) {
    logger.error("auth.request", {
      requestId,
      route: "api/auth",
      action,
      provider,
      method: request.method,
      status: 500,
      durationMs: Date.now() - startedAt,
      error,
    });
    throw error;
  }
};

export { logAuthRequest as GET, logAuthRequest as POST };
