export const LOG_EVENT = {
  AUTH_REQUEST: "auth.request",
  LESSON_CONTENT_REQUEST: "lesson_content.request",
  LESSON_CONTENT_FETCH_FAILED: "lesson_content.fetch_failed",
  PROGRESS_READ: "progress.read",
  PROGRESS_WRITE: "progress.write",
  PROGRESS_MERGE: "progress.merge",
} as const;

export const LOG_ROUTE = {
  AUTH: "api/auth",
  LESSON_CONTENT: "GET /api/lesson-content",
  PROGRESS_READ: "GET /api/progress",
  PROGRESS_WRITE: "POST /api/progress",
  PROGRESS_MERGE: "POST /api/progress/merge",
} as const;

export const LOG_REASON = {
  BLOCKED: "blocked",
  INVALID_PAYLOAD: "invalid_payload",
  INVALID_QUERY: "invalid_query",
  LESSON_NOT_FOUND: "lesson_not_found",
  NO_VALID_LESSONS: "no_valid_lessons",
  RATE_LIMITED: "rate_limited",
  UNAUTHORIZED: "unauthorized",
} as const;

export const LOG_CACHE = {
  HIT: "hit",
  MISS: "miss",
} as const;
