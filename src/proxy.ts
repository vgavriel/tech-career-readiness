import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { HTTP_HEADER } from "@/lib/http-constants";
import { REQUEST_ID_HEADER, resolveRequestId } from "@/lib/request-id";

const isProduction = process.env.NODE_ENV === "production";

const buildContentSecurityPolicy = (nonce: string) => {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`];
  const styleSrc = ["'self'", `'nonce-${nonce}'`];
  const connectSrc = ["'self'", "https://vitals.vercel-insights.com"];

  if (!isProduction) {
    scriptSrc.push("'unsafe-eval'");
    connectSrc.push("ws:", "wss:");
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: https:",
    `style-src ${styleSrc.join(" ")}`,
    "font-src 'self' data: https: blob:",
    `script-src ${scriptSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    "upgrade-insecure-requests",
  ];

  return directives.join("; ").replace(/\s{2,}/g, " ").trim();
};

const isHtmlRequest = (request: NextRequest) => {
  const accept = request.headers.get(HTTP_HEADER.ACCEPT);
  return accept?.includes("text/html");
};

const generateNonce = () => {
  const uuid = crypto.randomUUID();
  if (typeof Buffer !== "undefined") {
    return Buffer.from(uuid).toString("base64");
  }
  if (typeof btoa !== "undefined") {
    return btoa(uuid);
  }
  return uuid;
};

export function proxy(request: NextRequest) {
  const requestId = resolveRequestId(request, crypto.randomUUID());
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  let csp: string | null = null;
  if (isHtmlRequest(request)) {
    const nonce = generateNonce();
    csp = buildContentSecurityPolicy(nonce);
    requestHeaders.set(HTTP_HEADER.NONCE, nonce);
    requestHeaders.set(HTTP_HEADER.CONTENT_SECURITY_POLICY, csp);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(REQUEST_ID_HEADER, requestId);
  if (csp) {
    response.headers.set(HTTP_HEADER.CONTENT_SECURITY_POLICY, csp);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
