import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

const buildContentSecurityPolicy = (nonce: string) => {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`];
  const styleSrc = ["'self'", `'nonce-${nonce}'`];
  const connectSrc = ["'self'"];

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

  return directives.join("; ");
};

const isHtmlRequest = (request: NextRequest) => {
  const accept = request.headers.get("accept");
  return accept?.includes("text/html");
};

const generateNonce = () => {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

export function proxy(request: NextRequest) {
  if (!isHtmlRequest(request)) {
    return NextResponse.next();
  }

  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
