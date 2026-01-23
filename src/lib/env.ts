import { z } from "zod";

const appEnvSchema = z.enum(["local", "preview", "production", "test"]);

const fallbackAppEnv = () => {
  if (process.env.NODE_ENV === "production") {
    return "production";
  }
  if (process.env.NODE_ENV === "test") {
    return "test";
  }
  return "local";
};

const envSchema = z.object({
  APP_ENV: appEnvSchema,
  DATABASE_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  MAX_JSON_BODY_BYTES: z.string().optional(),
  LESSON_CONTENT_MOCK_HTML: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  DEV_AUTH_EMAIL: z.string().optional(),
  DEV_AUTH_NAME: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  LOG_SAMPLE_RATE: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_ENABLED: z.string().optional(),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export type Env = z.infer<typeof envSchema> & {
  appEnv: AppEnv;
  isLocal: boolean;
  isPreview: boolean;
  isProduction: boolean;
  isTest: boolean;
};

let cachedEnv: Env | null = null;

const buildEnv = (): Env => {
  const parsed = envSchema.parse({
    ...process.env,
    APP_ENV: process.env.APP_ENV ?? fallbackAppEnv(),
  });

  const appEnv = parsed.APP_ENV;
  return {
    ...parsed,
    appEnv,
    isLocal: appEnv === "local",
    isPreview: appEnv === "preview",
    isProduction: appEnv === "production",
    isTest: appEnv === "test",
  };
};

export const getEnv = (): Env => {
  const shouldCache = process.env.APP_ENV !== "test" && process.env.NODE_ENV !== "test";
  if (!shouldCache) {
    return buildEnv();
  }

  if (!cachedEnv) {
    cachedEnv = buildEnv();
  }
  return cachedEnv;
};

export const requireEnv = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
};
