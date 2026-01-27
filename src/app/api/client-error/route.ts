import { NextResponse } from "next/server";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

import { parseJsonBody } from "@/lib/api-helpers";
import { createRequestLogger } from "@/lib/logger";
import { LOG_EVENT, LOG_REASON, LOG_ROUTE } from "@/lib/log-constants";
import { enforceRateLimit, RATE_LIMIT_BUCKET } from "@/lib/rate-limit";
import { enforceStateChangeSecurity } from "@/lib/request-guard";
import { resolveRequestId } from "@/lib/request-id";

const clientErrorSchema = z
  .object({
    message: z.string().trim().min(1),
    name: z.string().trim().optional(),
    stack: z.string().trim().optional(),
    url: z.string().trim().optional(),
    source: z.string().trim().optional(),
    lineno: z.number().int().optional(),
    colno: z.number().int().optional(),
    componentStack: z.string().trim().optional(),
    userAgent: z.string().trim().optional(),
  })
  .strict();

/**
 * POST /api/client-error: capture client-side errors for observability.
 */
export async function POST(request: Request) {
  const requestId = resolveRequestId(request);
  const logRequest = createRequestLogger({
    event: LOG_EVENT.CLIENT_ERROR,
    route: LOG_ROUTE.CLIENT_ERROR,
    requestId,
  });

  const guardResponse = enforceStateChangeSecurity(request);
  if (guardResponse) {
    logRequest("warn", { status: guardResponse.status, reason: LOG_REASON.BLOCKED });
    return guardResponse;
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    RATE_LIMIT_BUCKET.CLIENT_ERROR,
    null
  );
  if (rateLimitResponse) {
    logRequest("warn", {
      status: rateLimitResponse.status,
      reason: LOG_REASON.RATE_LIMITED,
    });
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody(request, clientErrorSchema);
  if ("error" in parsedBody) {
    logRequest("warn", {
      status: parsedBody.error.status,
      reason: LOG_REASON.INVALID_PAYLOAD,
    });
    return parsedBody.error;
  }

  logRequest("error", {
    status: StatusCodes.OK,
    error: parsedBody.data,
  });

  return NextResponse.json({ ok: true }, { status: StatusCodes.OK });
}
