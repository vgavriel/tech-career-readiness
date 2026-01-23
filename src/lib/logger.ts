import { getEnv } from "@/lib/env";

export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const REDACTED_VALUE = "[REDACTED]";
const MAX_REDACTION_DEPTH = 4;

const REDACT_KEY_EXACT = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "email",
  "name",
  "image",
  "avatar",
]);

const REDACT_KEY_CONTAINS = ["token", "secret", "password"];

const resolveLogLevel = (value: string | undefined, env: ReturnType<typeof getEnv>): LogLevel => {
  const normalized = value?.toLowerCase();
  if (normalized && normalized in LOG_LEVEL_RANK) {
    return normalized as LogLevel;
  }

  if (env.isLocal) {
    return "debug";
  }
  if (env.isTest) {
    return "warn";
  }
  return "info";
};

const parseSampleRate = (value: string | undefined): number => {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(1, Math.max(0, parsed));
};

const env = getEnv();
const resolvedLevel = resolveLogLevel(env.LOG_LEVEL, env);
const logConfig = {
  level: resolvedLevel,
  minRank: LOG_LEVEL_RANK[resolvedLevel],
  sampleRate: parseSampleRate(env.LOG_SAMPLE_RATE),
};

const shouldRedactKey = (key: string) => {
  const normalized = key.toLowerCase();
  if (REDACT_KEY_EXACT.has(normalized)) {
    return true;
  }
  return REDACT_KEY_CONTAINS.some((candidate) => normalized.includes(candidate));
};

const serializeError = (error: Error) => ({
  name: error.name,
  message: error.message,
  stack: error.stack,
});

const redactValue = (
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown => {
  if (value instanceof Error) {
    return serializeError(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  if (depth >= MAX_REDACTION_DEPTH) {
    return "[Truncated]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, depth + 1, seen));
  }

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    output[key] = shouldRedactKey(key)
      ? REDACTED_VALUE
      : redactValue(entry, depth + 1, seen);
  }
  return output;
};

const redactFields = (fields: LogFields = {}) =>
  redactValue(fields, 0, new WeakSet<object>()) as LogFields;

const shouldLog = (level: LogLevel) => {
  if (LOG_LEVEL_RANK[level] < logConfig.minRank) {
    return false;
  }

  if (level === "warn" || level === "error") {
    return true;
  }

  if (logConfig.sampleRate >= 1) {
    return true;
  }

  return Math.random() < logConfig.sampleRate;
};

const emitLog = (level: LogLevel, message: string, fields?: LogFields) => {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redactFields(fields),
  };

  const entry = JSON.stringify(payload);

  if (level === "debug") {
    console.debug(entry);
    return;
  }
  if (level === "info") {
    console.info(entry);
    return;
  }
  if (level === "warn") {
    console.warn(entry);
    return;
  }
  console.error(entry);
};

export const logger = {
  debug: (message: string, fields?: LogFields) => emitLog("debug", message, fields),
  info: (message: string, fields?: LogFields) => emitLog("info", message, fields),
  warn: (message: string, fields?: LogFields) => emitLog("warn", message, fields),
  error: (message: string, fields?: LogFields) => emitLog("error", message, fields),
};
