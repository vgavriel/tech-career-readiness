import { ERROR_MESSAGE } from "@/lib/http-constants";

const allowedLessonHosts = new Set(["docs.google.com", "drive.google.com"]);

const LESSON_CONTENT_FETCH_TIMEOUT_MS = 8000;

/**
 * Validate and return the lesson URL, enforcing the allowlist.
 */
export const assertAllowedLessonUrl = (publishedUrl: string) => {
  let url: URL;

  try {
    url = new URL(publishedUrl);
  } catch {
    throw new Error("Lesson URL is invalid.");
  }

  if (url.protocol !== "https:" || !allowedLessonHosts.has(url.hostname)) {
    throw new Error("Lesson URL is not allowed.");
  }

  return url;
};

const fetchWithTimeout = async (input: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Fetch published lesson HTML, following safe redirects up to the limit.
 */
export const fetchLessonHtml = async (url: URL, maxRedirects = 3) => {
  let currentUrl = url;

  for (let attempt = 0; attempt <= maxRedirects; attempt += 1) {
    const response = await fetchWithTimeout(
      currentUrl.toString(),
      {
        cache: "no-store",
        redirect: "manual",
      },
      LESSON_CONTENT_FETCH_TIMEOUT_MS
    );

    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      const redirectUrl = new URL(response.headers.get("location") ?? "", currentUrl);
      if (redirectUrl.protocol !== "https:" || !allowedLessonHosts.has(redirectUrl.hostname)) {
        throw new Error("Lesson URL is not allowed.");
      }

      currentUrl = redirectUrl;
      continue;
    }

    if (!response.ok) {
      throw new Error(ERROR_MESSAGE.LESSON_CONTENT_FETCH_FAILED);
    }

    return response.text();
  }

  throw new Error("Too many redirects while fetching lesson content.");
};
