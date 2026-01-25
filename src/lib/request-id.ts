export const REQUEST_ID_HEADER = "x-request-id";
export const UNKNOWN_REQUEST_ID = "unknown";

/**
 * Read the request id if present and non-empty.
 */
export const getRequestId = (request: Request): string | null => {
  const value = request.headers.get(REQUEST_ID_HEADER);
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/**
 * Resolve a request id, falling back to a default value when missing.
 */
export const resolveRequestId = (
  request: Request,
  fallback: string = UNKNOWN_REQUEST_ID
): string => getRequestId(request) ?? fallback;
