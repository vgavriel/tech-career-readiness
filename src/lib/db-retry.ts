import { Prisma } from "@prisma/client";

const RETRYABLE_ERROR_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
  "P2034",
]);

/**
 * Sleep for the specified duration in milliseconds.
 */
const sleep = (delayMs: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

/**
 * Configuration for retrying Prisma operations.
 */
export type DbRetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

/**
 * Determine whether a Prisma error is safe to retry.
 */
const isRetryableError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_ERROR_CODES.has(error.code);
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  return false;
};

/**
 * Execute a Prisma operation with retry/backoff for transient errors.
 */
export const withDbRetry = async <T>(
  operation: () => Promise<T>,
  options: DbRetryOptions = {}
): Promise<T> => {
  const { maxRetries = 3, baseDelayMs = 50, maxDelayMs = 1000 } = options;
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (!isRetryableError(error) || attempt >= maxRetries) {
        throw error;
      }

      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const jitter = Math.floor(delay * 0.2 * Math.random());

      attempt += 1;
      await sleep(delay + jitter);
    }
  }
};
