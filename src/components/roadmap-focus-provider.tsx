"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

import type { RoadmapModule } from "@/components/roadmap-module-list";
import type { FocusKey } from "@/lib/focus-options";
import { orderModulesForFocus } from "@/lib/focus-order";
import {
  readFocusSelection,
  subscribeToFocusSelection,
  writeFocusSelection,
} from "@/lib/focus-selection";

/**
 * Public API exposed by the roadmap focus context.
 */
type RoadmapFocusContextValue = {
  focusKey: FocusKey | null;
  focusModules: RoadmapModule[] | null;
};

/**
 * Props for the roadmap focus provider.
 */
type RoadmapFocusProviderProps = {
  modules: RoadmapModule[];
  focusKey?: FocusKey | null;
  children: React.ReactNode;
};

const RoadmapFocusContext = createContext<RoadmapFocusContextValue | null>(null);

/**
 * Provide focus-aware module ordering for the roadmap experience.
 */
export function RoadmapFocusProvider({ modules, focusKey, children }: RoadmapFocusProviderProps) {
  const storedFocusKey = useSyncExternalStore(
    subscribeToFocusSelection,
    () => readFocusSelection().focusKey ?? null,
    () => null
  );
  const activeFocusKey = focusKey ?? storedFocusKey;

  useEffect(() => {
    if (focusKey) {
      writeFocusSelection(focusKey);
    }
  }, [focusKey]);

  const focusModules = useMemo(() => {
    if (!activeFocusKey) {
      return null;
    }

    return orderModulesForFocus(modules, activeFocusKey);
  }, [activeFocusKey, modules]);

  const value = useMemo(
    () => ({ focusKey: activeFocusKey, focusModules }),
    [activeFocusKey, focusModules]
  );

  return <RoadmapFocusContext.Provider value={value}>{children}</RoadmapFocusContext.Provider>;
}

/**
 * Read the roadmap focus context, throwing if used outside the provider.
 */
export const useRoadmapFocus = () => {
  const context = useContext(RoadmapFocusContext);
  if (!context) {
    throw new Error("useRoadmapFocus must be used within RoadmapFocusProvider.");
  }
  return context;
};
