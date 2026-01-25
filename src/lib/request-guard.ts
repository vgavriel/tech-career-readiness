import { StatusCodes } from "http-status-codes";

import { errorResponse } from "@/lib/api-helpers";
import { ERROR_MESSAGE, HTTP_HEADER } from "@/lib/http-constants";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Normalize a URL string to its origin, returning null for invalid input.
 */
const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/**
 * Build the set of allowed origins for state-changing requests.
 */
const buildAllowedOrigins = (request: Request) => {
  const origins = new Set<string>();

  const requestOrigin = normalizeOrigin(request.url);
  if (requestOrigin) {
    origins.add(requestOrigin);
  }

  const configuredOrigins = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];

  for (const origin of configuredOrigins) {
    const normalized = origin ? normalizeOrigin(origin) : null;
    if (normalized) {
      origins.add(normalized);
    }
  }

  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  return origins;
};

/**
 * Guard state-changing requests with JSON content type and origin checks.
 */
export const enforceStateChangeSecurity = (request: Request) => {
  if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const contentType = request.headers.get(HTTP_HEADER.CONTENT_TYPE) ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return errorResponse(
      ERROR_MESSAGE.UNSUPPORTED_MEDIA_TYPE,
      StatusCodes.UNSUPPORTED_MEDIA_TYPE
    );
  }

  const originHeader = request.headers.get(HTTP_HEADER.ORIGIN);
  const refererHeader = request.headers.get(HTTP_HEADER.REFERER);
  const origin = originHeader
    ? normalizeOrigin(originHeader)
    : refererHeader
      ? normalizeOrigin(refererHeader)
      : null;

  if (!origin) {
    return errorResponse(
      ERROR_MESSAGE.ORIGIN_REQUIRED,
      StatusCodes.FORBIDDEN
    );
  }

  const allowedOrigins = buildAllowedOrigins(request);
  if (!allowedOrigins.has(origin)) {
    return errorResponse(ERROR_MESSAGE.INVALID_ORIGIN, StatusCodes.FORBIDDEN);
  }

  return null;
};
