import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";
import { type ZodSchema } from "zod";

import { ERROR_MESSAGE, HTTP_HEADER } from "@/lib/http-constants";
import { DEFAULT_MAX_JSON_BODY_BYTES } from "@/lib/limits";

/**
 * Result of parsing a JSON body with validation.
 */
type ParsedBodyResult<T> = { data: T } | { error: NextResponse };

type ErrorResponseOptions = {
  headers?: HeadersInit;
};

/**
 * Parse and validate a JSON request body with size enforcement.
 */
export const parseJsonBody = async <T>(
  request: Request,
  schema: ZodSchema<T>,
  options: { maxBytes?: number } = {}
): Promise<ParsedBodyResult<T>> => {
  const envMaxBytes = Number(process.env.MAX_JSON_BODY_BYTES);
  const maxBytes =
    options.maxBytes ??
    (Number.isFinite(envMaxBytes) && envMaxBytes > 0 ? envMaxBytes : DEFAULT_MAX_JSON_BODY_BYTES);

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return {
      error: errorResponse(ERROR_MESSAGE.INVALID_JSON_BODY, StatusCodes.BAD_REQUEST),
    };
  }

  const bodyByteLength = Buffer.byteLength(rawBody, "utf8");
  if (bodyByteLength > maxBytes) {
    return {
      error: errorResponse(ERROR_MESSAGE.REQUEST_TOO_LONG, StatusCodes.REQUEST_TOO_LONG),
    };
  }

  let parsedBody: unknown = null;
  if (rawBody.length > 0) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return {
        error: errorResponse(ERROR_MESSAGE.INVALID_JSON_BODY, StatusCodes.BAD_REQUEST),
      };
    }
  }

  const result = schema.safeParse(parsedBody);
  if (!result.success) {
    return {
      error: errorResponse(ERROR_MESSAGE.INVALID_PAYLOAD, StatusCodes.BAD_REQUEST),
    };
  }

  return { data: result.data };
};

/**
 * Standard unauthorized response payload.
 */
export const errorResponse = (
  message: string,
  status: number,
  options: ErrorResponseOptions = {}
) => NextResponse.json({ error: message }, { status, headers: options.headers });

export const unauthorizedResponse = () =>
  errorResponse(ERROR_MESSAGE.UNAUTHORIZED, StatusCodes.UNAUTHORIZED);

export const tooManyRequestsResponse = (retryAfterSeconds: number) =>
  errorResponse(ERROR_MESSAGE.TOO_MANY_REQUESTS, StatusCodes.TOO_MANY_REQUESTS, {
    headers: {
      [HTTP_HEADER.RETRY_AFTER]: retryAfterSeconds.toString(),
    },
  });
