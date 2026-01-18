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

import { normalizeFocusKey, type FocusKey } from "@/lib/focus-options";

type FocusContextValue = {
  focusKey: FocusKey | null;
  isReady: boolean;
  isUpdating: boolean;
  setFocusKey: (focusKey: FocusKey | null) => Promise<void>;
};

type FocusProviderProps = {
  initialFocusKey?: FocusKey | null;
  children: React.ReactNode;
};

const FocusContext = createContext<FocusContextValue | null>(null);

const fetchFocusSelection = async () => {
  const response = await fetch("/api/focus", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch focus.");
  }

  const body = (await response.json()) as { focusKey?: string | null };
  return normalizeFocusKey(body.focusKey);
};

const updateFocusSelection = async (focusKey: FocusKey | null) => {
  const response = await fetch("/api/focus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ focusKey }),
  });

  if (!response.ok) {
    throw new Error("Failed to update focus.");
  }

  const body = (await response.json()) as { focusKey?: string | null };
  return normalizeFocusKey(body.focusKey);
};

export function FocusProvider({
  initialFocusKey = null,
  children,
}: FocusProviderProps) {
  const { data: session, status } = useSession();
  const [focusKey, setFocusKeyState] = useState<FocusKey | null>(
    initialFocusKey
  );
  const [isReady, setIsReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const focusRef = useRef<FocusKey | null>(initialFocusKey);
  const lastLoadedFor = useRef<string | null>(null);

  useEffect(() => {
    focusRef.current = focusKey;
  }, [focusKey]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated") {
      lastLoadedFor.current = null;
      setIsReady(true);
      return;
    }

    const email = session?.user?.email ?? null;
    if (!email) {
      setIsReady(true);
      return;
    }

    if (lastLoadedFor.current === email) {
      return;
    }

    lastLoadedFor.current = email;
    setIsReady(false);

    void (async () => {
      try {
        const serverFocus = await fetchFocusSelection();
        setFocusKeyState(serverFocus);
      } catch (error) {
        console.error(error);
      } finally {
        setIsReady(true);
      }
    })();
  }, [session?.user?.email, status]);

  const setFocusKey = useCallback(
    async (nextFocusKey: FocusKey | null) => {
      const normalized = normalizeFocusKey(nextFocusKey);
      const previous = focusRef.current;
      setFocusKeyState(normalized);

      if (status !== "authenticated") {
        return;
      }

      setIsUpdating(true);
      try {
        const saved = await updateFocusSelection(normalized);
        setFocusKeyState(saved);
      } catch (error) {
        console.error(error);
        setFocusKeyState(previous ?? null);
      } finally {
        setIsUpdating(false);
      }
    },
    [status]
  );

  const value = useMemo(
    () => ({
      focusKey,
      isReady,
      isUpdating,
      setFocusKey,
    }),
    [focusKey, isReady, isUpdating, setFocusKey]
  );

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error("useFocus must be used within FocusProvider.");
  }
  return context;
};
