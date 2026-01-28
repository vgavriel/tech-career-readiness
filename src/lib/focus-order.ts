import { type FocusKey, normalizeFocusKey } from "@/lib/focus-options";

type FocusModule = {
  key: string;
  order?: number | null;
};

/**
 * Module ordering per focus selection.
 */
export const FOCUS_MODULE_ORDER: Record<FocusKey, string[]> = {
  "just-starting": [
    "start-here",
    "explore-roles",
    "build-experience",
    "opportunities-networking",
    "research-companies",
    "applications",
  ],
  "applying-soon": [
    "start-here",
    "opportunities-networking",
    "research-companies",
    "applications",
    "interviews",
  ],
  "interviewing-soon": ["start-here", "research-companies", "applications", "interviews"],
  "offer-in-hand": ["offers", "internship-success"],
};

/**
 * Normalize a query param into a FocusKey, handling arrays.
 */
export const getFocusKeyFromParam = (param: string | string[] | undefined): FocusKey | null => {
  if (!param) {
    return null;
  }

  const rawValue = Array.isArray(param) ? param[0] : param;
  return normalizeFocusKey(rawValue);
};

/**
 * Order modules for a given focus, falling back to original order when unknown.
 */
export const orderModulesForFocus = <T extends FocusModule>(
  modules: T[],
  focusKey: FocusKey | null
): T[] => {
  if (!focusKey) {
    return modules;
  }

  const order = FOCUS_MODULE_ORDER[focusKey];
  if (!order || order.length === 0) {
    return modules;
  }

  const orderSet = new Set(order);
  const filtered = modules.filter((module) => orderSet.has(module.key));

  if (filtered.length === 0) {
    return modules;
  }

  const canSortByOrder = filtered.every((module) => typeof module.order === "number");
  if (!canSortByOrder) {
    return filtered;
  }

  return [...filtered].sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
};
