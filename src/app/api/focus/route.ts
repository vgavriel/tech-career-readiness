import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/auth-user";
import { parseJsonBody } from "@/lib/api-helpers";
import { withDbRetry } from "@/lib/db-retry";
import { normalizeFocusKey } from "@/lib/focus-options";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { enforceStateChangeSecurity } from "@/lib/request-guard";

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
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    "focus-read",
    user.id
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return NextResponse.json({ focusKey: user.focusKey ?? null });
}

/**
 * POST /api/focus: update the current user's focus key.
 */
export async function POST(request: Request) {
  const guardResponse = enforceStateChangeSecurity(request);
  if (guardResponse) {
    return guardResponse;
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rateLimitResponse = await enforceRateLimit(
    request,
    "focus-write",
    user.id
  );
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const parsedBody = await parseJsonBody(request, focusUpdateSchema);
  if ("error" in parsedBody) {
    return parsedBody.error;
  }

  const normalized = normalizeFocusKey(parsedBody.data.focusKey);
  if (parsedBody.data.focusKey && !normalized) {
    return NextResponse.json({ error: "Invalid focus key." }, { status: 400 });
  }

  const updatedUser = await withDbRetry(() =>
    prisma.user.update({
      where: { id: user.id },
      data: { focusKey: normalized },
    })
  );

  return NextResponse.json({ focusKey: updatedUser.focusKey ?? null });
}
