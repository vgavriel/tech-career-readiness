import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";
import { HTTP_STATUS } from "@/lib/http-constants";
import { createRequestLogger } from "@/lib/logger";
import { LOG_EVENT, LOG_ROUTE } from "@/lib/log-constants";
import { resolveRequestId } from "@/lib/request-id";
import { UNKNOWN_VALUE } from "@/lib/values";

/**
 * Create a shared NextAuth handler for GET and POST routes.
 */
const handler = NextAuth(authOptions);

type AuthRouteContext = {
  params: Promise<{ nextauth?: string[] }> | { nextauth?: string[] };
};

const logAuthRequest = async (request: Request, context: AuthRouteContext) => {
  const requestId = resolveRequestId(request);
  const params = await context.params;
  const segments = params?.nextauth ?? [];
  const action = segments[0] ?? UNKNOWN_VALUE;
  const provider = segments[1];
  const logRequest = createRequestLogger({
    event: LOG_EVENT.AUTH_REQUEST,
    route: LOG_ROUTE.AUTH,
    requestId,
  });

  try {
    const response = await handler(request, context);
    logRequest("info", {
      action,
      provider,
      method: request.method,
      status: response.status,
    });
    return response;
  } catch (error) {
    logRequest("error", {
      action,
      provider,
      method: request.method,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      error,
    });
    throw error;
  }
};

export { logAuthRequest as GET, logAuthRequest as POST };
