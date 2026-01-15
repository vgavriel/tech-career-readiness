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
  completedLessonKeys: string[];
  isLessonCompleted: (lessonKey: string, legacyLessonId?: string) => boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  isMerging: boolean;
  setLessonCompletion: (lessonKey: string, completed: boolean) => Promise<void>;
  refreshProgress: () => Promise<void>;
};

/**
 * Internal map of lessonKey -> completion marker.
 */
type ProgressMap = Record<string, string>;

/**
 * Props for the progress provider component.
 */
type ProgressProviderProps = {
  children: React.ReactNode;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

/**
 * Convert a list of completed lesson keys into the map shape.
 */
const buildProgressMap = (lessonKeys: string[]): ProgressMap =>
  lessonKeys.reduce<ProgressMap>((accumulator, lessonKey) => {
    accumulator[lessonKey] = "completed";
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

  const body = (await response.json()) as { completedLessonKeys?: string[] };
  const completedLessonKeys = Array.isArray(body.completedLessonKeys)
    ? body.completedLessonKeys
    : [];

  return buildProgressMap(completedLessonKeys);
};

/**
 * Merge guest progress into the authenticated account.
 */
const mergeGuestProgress = async (guestProgress: ProgressMap) => {
  // Include legacy IDs to merge older guest progress entries.
  const entries = Object.keys(guestProgress).map((lessonKey) => ({
    lessonKey,
    lessonId: lessonKey,
  }));

  const response = await fetch("/api/progress/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
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
  const mergeAttemptedFor = useRef<string | null>(null);

  const isAuthenticated = status === "authenticated";

  const isLessonCompleted = useCallback(
    (lessonKey: string, legacyLessonId?: string) =>
      Boolean(
        progressMap[lessonKey] ||
          (legacyLessonId ? progressMap[legacyLessonId] : false)
      ),
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

  const setLessonCompletion = useCallback(
    async (lessonKey: string, completed: boolean) => {
      const trimmedLessonKey = lessonKey.trim();
      if (!trimmedLessonKey) {
        return;
      }

      if (isAuthenticated) {
        try {
          const response = await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonKey: trimmedLessonKey,
              completed,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update progress.");
          }

          setProgressMap((previous) => {
            const updated = { ...previous };
            if (completed) {
              updated[trimmedLessonKey] =
                updated[trimmedLessonKey] ?? "completed";
            } else {
              delete updated[trimmedLessonKey];
            }
            return updated;
          });
        } catch (error) {
          console.error(error);
        }
      } else {
        const updated = updateGuestProgress(trimmedLessonKey, completed);
        setProgressMap(updated.completed);
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

  const completedLessonKeys = useMemo(
    () => Object.keys(progressMap),
    [progressMap]
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      completedLessonKeys,
      isLessonCompleted,
      isReady,
      isAuthenticated,
      isMerging,
      setLessonCompletion,
      refreshProgress,
    }),
    [
      completedLessonKeys,
      isLessonCompleted,
      isReady,
      isAuthenticated,
      isMerging,
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
