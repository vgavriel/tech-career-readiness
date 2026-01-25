import { NextResponse } from "next/server";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { errorResponse, parseJsonBody, unauthorizedResponse } from "@/lib/api-helpers";
import { withDbRetry } from "@/lib/db-retry";
import { normalizeFocusKey } from "@/lib/focus-options";
import { ERROR_MESSAGE } from "@/lib/http-constants";
import { createRequestLogger } from "@/lib/logger";
import { LOG_EVENT, LOG_REASON, LOG_ROUTE } from "@/lib/log-constants";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit, RATE_LIMIT_BUCKET } from "@/lib/rate-limit";
import { enforceStateChangeSecurity } from "@/lib/request-guard";
import { resolveRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

const focusUpdateSchema = z
  .object({
    focusKey: z.string().trim().nullable().optional(),
  })
  .strict();

/**
 * GET /api/focus: return the stored focus key for the current user.
 */
export async function GET(request: Request) {
  const requestId = resolveRequestId(request);
  const logRequest = createRequestLogger({
    event: LOG_EVENT.FOCUS_READ,
    route: LOG_ROUTE.FOCUS_READ,
    requestId,
  });

  const user = await getAuthenticatedUser();

  if (!user) {
    logRequest("warn", {
      status: StatusCodes.UNAUTHORIZED,
      reason: LOG_REASON.UNAUTHORIZED,
    });
    return unauthorizedResponse();
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    RATE_LIMIT_BUCKET.FOCUS_READ,
    user.id
  );
  if (rateLimitResponse) {
    logRequest("warn", {
      status: rateLimitResponse.status,
      reason: LOG_REASON.RATE_LIMITED,
    });
    return rateLimitResponse;
  }

  logRequest("info", {
    status: StatusCodes.OK,
    focusKey: user.focusKey ?? null,
    userId: user.id,
  });
  return NextResponse.json({ focusKey: user.focusKey ?? null });
}

/**
 * POST /api/focus: update the current user's focus key.
 */
export async function POST(request: Request) {
  const requestId = resolveRequestId(request);
  const logRequest = createRequestLogger({
    event: LOG_EVENT.FOCUS_WRITE,
    route: LOG_ROUTE.FOCUS_WRITE,
    requestId,
  });

  const guardResponse = enforceStateChangeSecurity(request);
  if (guardResponse) {
    logRequest("warn", { status: guardResponse.status, reason: LOG_REASON.BLOCKED });
    return guardResponse;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    logRequest("warn", {
      status: StatusCodes.UNAUTHORIZED,
      reason: LOG_REASON.UNAUTHORIZED,
    });
    return unauthorizedResponse();
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    RATE_LIMIT_BUCKET.FOCUS_WRITE,
    user.id
  );
  if (rateLimitResponse) {
    logRequest("warn", {
      status: rateLimitResponse.status,
      reason: LOG_REASON.RATE_LIMITED,
    });
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody(request, focusUpdateSchema);
  if ("error" in parsedBody) {
    logRequest("warn", {
      status: parsedBody.error.status,
      reason: LOG_REASON.INVALID_PAYLOAD,
    });
    return parsedBody.error;
  }

  const normalized = normalizeFocusKey(parsedBody.data.focusKey);
  if (parsedBody.data.focusKey && !normalized) {
    logRequest("warn", {
      status: StatusCodes.BAD_REQUEST,
      reason: LOG_REASON.INVALID_FOCUS_KEY,
    });
    return errorResponse(ERROR_MESSAGE.INVALID_FOCUS_KEY, StatusCodes.BAD_REQUEST);
  }

  const updatedUser = await withDbRetry(() =>
    prisma.user.update({
      where: { id: user.id },
      data: { focusKey: normalized },
    })
  );

  logRequest("info", {
    status: StatusCodes.OK,
    focusKey: updatedUser.focusKey ?? null,
    userId: user.id,
  });
  return NextResponse.json({ focusKey: updatedUser.focusKey ?? null });
}
