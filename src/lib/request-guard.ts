import { NextResponse } from "next/server";

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

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Unsupported content type." },
      { status: 415 }
    );
  }

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const origin = originHeader
    ? normalizeOrigin(originHeader)
    : refererHeader
      ? normalizeOrigin(refererHeader)
      : null;

  if (!origin) {
    return NextResponse.json({ error: "Origin required." }, { status: 403 });
  }

  const allowedOrigins = buildAllowedOrigins(request);
  if (!allowedOrigins.has(origin)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  return null;
};
