import { HTTP_HEADER } from "@/lib/http-constants";
import { UNKNOWN_VALUE } from "@/lib/values";

/**
 * Canonical request-id header name.
 */
export const REQUEST_ID_HEADER = HTTP_HEADER.REQUEST_ID;
/**
 * Default placeholder when a request id is missing.
 */
export const UNKNOWN_REQUEST_ID = UNKNOWN_VALUE;

/**
 * Read the request id if present and non-empty.
 *
 * Trims whitespace and returns null for blank values.
 */
export const getRequestId = (request: Request): string | null => {
  const value = request.headers.get(REQUEST_ID_HEADER);
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Resolve a request id, falling back to a default value when missing.
 */
export const resolveRequestId = (request: Request, fallback: string = UNKNOWN_REQUEST_ID): string =>
  getRequestId(request) ?? fallback;
