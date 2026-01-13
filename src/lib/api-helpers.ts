import { type ZodSchema } from "zod";
import { NextResponse } from "next/server";

type ParsedBodyResult<T> = { data: T } | { error: NextResponse };

const DEFAULT_MAX_BODY_BYTES = 16_384;

export const parseJsonBody = async <T>(
  request: Request,
  schema: ZodSchema<T>,
  options: { maxBytes?: number } = {}
): Promise<ParsedBodyResult<T>> => {
  const envMaxBytes = Number(process.env.MAX_JSON_BODY_BYTES);
  const maxBytes =
    options.maxBytes ??
    (Number.isFinite(envMaxBytes) && envMaxBytes > 0
      ? envMaxBytes
      : DEFAULT_MAX_BODY_BYTES);

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }

  if (rawBody.length > maxBytes) {
    return {
      error: NextResponse.json({ error: "Payload too large." }, { status: 413 }),
    };
  }

  let parsedBody: unknown = null;
  if (rawBody.length > 0) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return {
        error: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }),
      };
    }
  }

  const result = schema.safeParse(parsedBody);
  if (!result.success) {
    return {
      error: NextResponse.json({ error: "Invalid payload." }, { status: 400 }),
    };
  }

  return { data: result.data };
};
