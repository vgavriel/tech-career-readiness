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

type ProgressContextValue = {
  completedLessonIds: string[];
  isLessonCompleted: (lessonId: string) => boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  isMerging: boolean;
  setLessonCompletion: (lessonId: string, completed: boolean) => Promise<void>;
  refreshProgress: () => Promise<void>;
};

type ProgressMap = Record<string, string>;

const ProgressContext = createContext<ProgressContextValue | null>(null);

const buildProgressMap = (lessonIds: string[]): ProgressMap =>
  lessonIds.reduce<ProgressMap>((accumulator, lessonId) => {
    accumulator[lessonId] = "completed";
    return accumulator;
  }, {});

const fetchUserProgress = async () => {
  const response = await fetch("/api/progress", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch progress.");
  }

  const body = (await response.json()) as { completedLessonIds?: string[] };
  const completedLessonIds = Array.isArray(body.completedLessonIds)
    ? body.completedLessonIds
    : [];

  return buildProgressMap(completedLessonIds);
};

const mergeGuestProgress = async (guestProgress: ProgressMap) => {
  const entries = Object.entries(guestProgress).map(
    ([lessonId, completedAt]) => ({
      lessonId,
      completedAt,
    })
  );

  const response = await fetch("/api/progress/merge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  });

  if (!response.ok) {
    throw new Error("Failed to merge guest progress.");
  }
};

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [isReady, setIsReady] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const mergeAttemptedFor = useRef<string | null>(null);

  const isAuthenticated = status === "authenticated";

  const isLessonCompleted = useCallback(
    (lessonId: string) => Boolean(progressMap[lessonId]),
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
    async (lessonId: string, completed: boolean) => {
      const trimmedLessonId = lessonId.trim();
      if (!trimmedLessonId) {
        return;
      }

      if (isAuthenticated) {
        try {
          const response = await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lessonId: trimmedLessonId,
              completed,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to update progress.");
          }

          setProgressMap((previous) => {
            const updated = { ...previous };
            if (completed) {
              updated[trimmedLessonId] = updated[trimmedLessonId] ?? "completed";
            } else {
              delete updated[trimmedLessonId];
            }
            return updated;
          });
        } catch (error) {
          console.error(error);
        }
      } else {
        const updated = updateGuestProgress(trimmedLessonId, completed);
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

  const completedLessonIds = useMemo(
    () => Object.keys(progressMap),
    [progressMap]
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      completedLessonIds,
      isLessonCompleted,
      isReady,
      isAuthenticated,
      isMerging,
      setLessonCompletion,
      refreshProgress,
    }),
    [
      completedLessonIds,
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

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within ProgressProvider.");
  }
  return context;
};
