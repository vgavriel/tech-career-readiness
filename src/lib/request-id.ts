export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Read the request id if present and non-empty.
 */
export const getRequestId = (request: Request): string | null => {
  const value = request.headers.get(REQUEST_ID_HEADER);
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};
