"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";

import {
  clearGuestProgress,
  hasGuestProgress,
  readGuestProgress,
  updateGuestProgress,
} from "@/lib/guest-progress";

/**
 * Public API exposed by the progress context.
 */
type ProgressContextValue = {
  completedLessonSlugs: string[];
  isLessonCompleted: (lessonSlug: string) => boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  isMerging: boolean;
  progressError: ProgressError | null;
  clearProgressError: () => void;
  setLessonCompletion: (
    lessonSlug: string,
    completed: boolean,
    source?: ProgressErrorSource
  ) => Promise<void>;
  refreshProgress: () => Promise<void>;
};

/**
 * Internal map of lessonSlug -> completion marker.
 */
type ProgressMap = Record<string, string>;

/**
 * Props for the progress provider component.
 */
type ProgressProviderProps = {
  children: React.ReactNode;
};

type ProgressErrorSource = "toggle" | "navigator";

type ProgressError = {
  message: string;
  source: ProgressErrorSource;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

/**
 * Convert a list of completed lesson slugs into the map shape.
 */
const buildProgressMap = (lessonSlugs: string[]): ProgressMap =>
  lessonSlugs.reduce<ProgressMap>((accumulator, lessonSlug) => {
    accumulator[lessonSlug] = "completed";
    return accumulator;
  }, {});

/**
 * Fetch the authenticated user's progress map from the API.
 */
const fetchUserProgress = async () => {
  const response = await fetch("/api/progress", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch progress.");
  }

  const body = (await response.json()) as { completedLessonSlugs?: string[] };
  const completedLessonSlugs = Array.isArray(body.completedLessonSlugs)
    ? body.completedLessonSlugs
    : [];

  return buildProgressMap(completedLessonSlugs);
};

/**
 * Merge guest progress into the authenticated account.
 */
const mergeGuestProgress = async (guestProgress: ProgressMap) => {
  const lessonSlugs = Object.keys(guestProgress);

  const response = await fetch("/api/progress/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonSlugs }),
  });

  if (!response.ok) {
    throw new Error("Failed to merge guest progress.");
  }
};

/**
 * Provide progress state and actions to the client-side tree.
 *
 * @remarks
 * Owns progress state, merges guest data on sign-in, and triggers API
 * reads/writes with readiness and merging flags.
 */
export function ProgressProvider({ children }: ProgressProviderProps) {
  const { data: session, status } = useSession();
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [isReady, setIsReady] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [progressError, setProgressError] = useState<ProgressError | null>(null);
  const mergeAttemptedFor = useRef<string | null>(null);

  const isAuthenticated = status === "authenticated";

  const isLessonCompleted = useCallback(
    (lessonSlug: string) => Boolean(progressMap[lessonSlug]),
    [progressMap]
  );

  const loadGuestProgress = useCallback(() => {
    const guestProgress = readGuestProgress();
    setProgressMap(guestProgress.completed);
    setIsReady(true);
  }, []);

  const loadUserProgress = useCallback(async () => {
    try {
      const userProgress = await fetchUserProgress();
      setProgressMap(userProgress);
      setProgressError(null);
    } catch (error) {
      console.error(error);
      const fallback = readGuestProgress();
      setProgressMap(fallback.completed);
    } finally {
      setIsReady(true);
    }
  }, []);

  const refreshProgress = useCallback(async () => {
    if (isAuthenticated) {
      await loadUserProgress();
    } else {
      loadGuestProgress();
    }
  }, [isAuthenticated, loadGuestProgress, loadUserProgress]);

  const handleMerge = useCallback(async () => {
    const guestProgress = readGuestProgress();

    if (!hasGuestProgress(guestProgress)) {
      await loadUserProgress();
      return;
    }

    setIsMerging(true);
    try {
      await mergeGuestProgress(guestProgress.completed);
      clearGuestProgress();
      await loadUserProgress();
    } catch (error) {
      console.error(error);
      setProgressMap(guestProgress.completed);
      setIsReady(true);
    } finally {
      setIsMerging(false);
    }
  }, [loadUserProgress]);

  const clearProgressError = useCallback(() => {
    setProgressError(null);
  }, []);

  const setLessonCompletion = useCallback(
    async (
      lessonSlug: string,
      completed: boolean,
      source: ProgressErrorSource = "toggle"
    ) => {
      const trimmedLessonSlug = lessonSlug.trim();
      if (!trimmedLessonSlug) {
        return;
      }

      setProgressError(null);

      if (isAuthenticated) {
        try {
          const response = await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonSlug: trimmedLessonSlug,
              completed,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update progress.");
          }

          setProgressMap((previous) => {
            const updated = { ...previous };
            if (completed) {
              updated[trimmedLessonSlug] =
                updated[trimmedLessonSlug] ?? "completed";
            } else {
              delete updated[trimmedLessonSlug];
            }
            return updated;
          });
          setProgressError(null);
        } catch (error) {
          console.error(error);
          setProgressError({
            message: "We couldn't save your progress. Please try again.",
            source,
          });
        }
      } else {
        const updated = updateGuestProgress(trimmedLessonSlug, completed);
        setProgressMap(updated.completed);
        setProgressError(null);
      }
    },
    [isAuthenticated]
  );

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!isAuthenticated) {
      loadGuestProgress();
      mergeAttemptedFor.current = null;
      return;
    }

    const email = session?.user?.email ?? null;
    if (!email) {
      loadGuestProgress();
      return;
    }

    if (mergeAttemptedFor.current === email) {
      return;
    }

    mergeAttemptedFor.current = email;
    void handleMerge();
  }, [handleMerge, isAuthenticated, loadGuestProgress, session?.user?.email, status]);

  const completedLessonSlugs = useMemo(
    () => Object.keys(progressMap),
    [progressMap]
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      completedLessonSlugs,
      isLessonCompleted,
      isReady,
      isAuthenticated,
      isMerging,
      progressError,
      clearProgressError,
      setLessonCompletion,
      refreshProgress,
    }),
    [
      completedLessonSlugs,
      isLessonCompleted,
      isReady,
      isAuthenticated,
      isMerging,
      progressError,
      clearProgressError,
      setLessonCompletion,
      refreshProgress,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

/**
 * Read the progress context, throwing if used outside the provider.
 */
export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within ProgressProvider.");
  }
  return context;
};
