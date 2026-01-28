import type { ClientErrorPayload } from "@/lib/client-error-shared";

export type ScrubbedClientError = {
  message: string;
  name?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  urlPath?: string;
  stack?: string;
  componentStack?: string;
  userAgentHash?: string;
};

const MAX_MESSAGE_LENGTH = 300;
const MAX_STACK_LENGTH = 1500;
const MAX_COMPONENT_STACK_LENGTH = 1000;
const MAX_STACK_LINES = 5;

const truncateValue = (value: string | undefined, max: number) => {
  if (!value) {
    return value;
  }
  if (value.length <= max) {
    return value;
  }
  return value.slice(0, max);
};

const limitLines = (value: string, maxLines: number) =>
  value.split("\n").slice(0, maxLines).join("\n");

const scrubUrl = (value?: string) => {
  if (!value) {
    return undefined;
  }
  try {
    const parsed = new URL(value, "http://localhost");
    return parsed.pathname;
  } catch {
    return undefined;
  }
};

const hashValue = async (value?: string) => {
  if (!value) {
    return undefined;
  }
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  const { createHash } = await import("crypto");
  return createHash("sha256").update(value).digest("hex");
};

export const scrubClientError = async (
  payload: ClientErrorPayload
): Promise<ScrubbedClientError> => ({
  message: truncateValue(payload.message, MAX_MESSAGE_LENGTH) ?? "Unknown client error",
  name: truncateValue(payload.name, 120),
  source: truncateValue(payload.source, 200),
  lineno: payload.lineno,
  colno: payload.colno,
  urlPath: scrubUrl(payload.url),
  stack: truncateValue(
    payload.stack ? limitLines(payload.stack, MAX_STACK_LINES) : undefined,
    MAX_STACK_LENGTH
  ),
  componentStack: truncateValue(
    payload.componentStack ? limitLines(payload.componentStack, MAX_STACK_LINES) : undefined,
    MAX_COMPONENT_STACK_LENGTH
  ),
  userAgentHash: await hashValue(payload.userAgent),
});
