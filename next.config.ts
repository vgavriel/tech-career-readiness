import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const firstNonEmpty = (...values: Array<string | undefined>) =>
  values.find((value) => value?.trim())?.trim();
const appVersion =
  firstNonEmpty(
    process.env.NEXT_BUILD_ID,
    process.env.NEXT_PUBLIC_APP_VERSION,
    process.env.APP_VERSION
  ) ?? "dev";
const watchIgnoredPaths = [
  "**/.playwright-mcp/**",
  "**/playwright-report/**",
  "**/test-results/**",
] as const;

const toWatchIgnoredPatterns = (ignored: unknown) => [
  ...(Array.isArray(ignored)
    ? ignored.filter((pattern): pattern is string => typeof pattern === "string" && pattern !== "")
    : typeof ignored === "string" && ignored !== ""
      ? [ignored]
      : []),
  ...watchIgnoredPaths,
];

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "X-App-Version",
    value: appVersion,
  },
];

if (isProduction) {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  turbopack: {},
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: toWatchIgnoredPatterns(config.watchOptions?.ignored),
      };
    }

    return config;
  },
  /**
   * Keep the Next.js build id aligned with the deploy version.
   */
  async generateBuildId() {
    return appVersion;
  },
  /**
   * Attach security headers to all routes.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
