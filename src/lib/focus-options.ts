/**
 * Canonical focus identifiers used in routing and storage.
 */
export type FocusKey = "just-starting" | "applying-soon" | "interviewing-soon" | "offer-in-hand";

/**
 * Display metadata for a focus option.
 */
export type FocusOption = {
  key: FocusKey;
  label: string;
  description: string;
};

/**
 * Query string key for focus selection.
 */
export const FOCUS_QUERY_PARAM = "focus";

/**
 * Ordered list of available focus options.
 */
export const FOCUS_OPTIONS: FocusOption[] = [
  {
    key: "just-starting",
    label: "Just starting",
    description: "Explore roles and plan.",
  },
  {
    key: "applying-soon",
    label: "Applying soon",
    description: "Polish resume + outreach.",
  },
  {
    key: "interviewing-soon",
    label: "Interviewing soon",
    description: "Practice interviews + stories.",
  },
  {
    key: "offer-in-hand",
    label: "Offer in hand",
    description: "Evaluate and negotiate.",
  },
];

const focusKeySet = new Set(FOCUS_OPTIONS.map((option) => option.key));

/**
 * Type guard for valid FocusKey values.
 */
export const isFocusKey = (value: string): value is FocusKey => focusKeySet.has(value as FocusKey);

/**
 * Normalize unknown input to a FocusKey or null.
 */
export const normalizeFocusKey = (value: unknown): FocusKey | null => {
  if (typeof value !== "string") {
    return null;
  }

  return isFocusKey(value) ? value : null;
};
