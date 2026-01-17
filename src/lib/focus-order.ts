import { normalizeFocusKey, type FocusKey } from "@/lib/focus-options";

type FocusModule = {
  key: string;
};

export const FOCUS_MODULE_ORDER: Record<FocusKey, string[]> = {
  "just-starting": [
    "foundations-mindset",
    "research-targeting",
    "resume-portfolio",
    "networking-outreach",
    "applications-tracking",
  ],
  "applying-soon": [
    "foundations-mindset",
    "networking-outreach",
    "resume-portfolio",
    "applications-tracking",
    "research-targeting",
    "interview-prep",
  ],
  "interviewing-soon": [
    "foundations-mindset",
    "interview-prep",
    "research-targeting",
    "resume-portfolio",
  ],
  "offer-in-hand": ["offer-negotiation"],
};

export const getFocusKeyFromParam = (
  param: string | string[] | undefined
): FocusKey | null => {
  if (!param) {
    return null;
  }

  const rawValue = Array.isArray(param) ? param[0] : param;
  return normalizeFocusKey(rawValue);
};

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

  const orderIndex = new Map(order.map((key, index) => [key, index]));
  const filtered = modules.filter((module) => orderIndex.has(module.key));

  if (filtered.length === 0) {
    return modules;
  }

  return [...filtered].sort(
    (left, right) =>
      (orderIndex.get(left.key) ?? 0) - (orderIndex.get(right.key) ?? 0)
  );
};
