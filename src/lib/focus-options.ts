export type FocusKey =
  | "just-starting"
  | "applying-soon"
  | "interviewing-soon"
  | "offer-in-hand";

export type FocusOption = {
  key: FocusKey;
  label: string;
  description: string;
  timing: string;
};

export const FOCUS_QUERY_PARAM = "focus";

export const FOCUS_OPTIONS: FocusOption[] = [
  {
    key: "just-starting",
    label: "Just starting",
    timing: "Explore",
    description: "Explore roles and plan.",
  },
  {
    key: "applying-soon",
    label: "Applying soon",
    timing: "1-2 weeks",
    description: "Polish resume + outreach.",
  },
  {
    key: "interviewing-soon",
    label: "Interviewing soon",
    timing: "Next up",
    description: "Practice interviews + stories.",
  },
  {
    key: "offer-in-hand",
    label: "Offer in hand",
    timing: "Decision",
    description: "Evaluate and negotiate.",
  },
];

const focusKeySet = new Set(FOCUS_OPTIONS.map((option) => option.key));

export const isFocusKey = (value: string): value is FocusKey =>
  focusKeySet.has(value as FocusKey);

export const normalizeFocusKey = (value: unknown): FocusKey | null => {
  if (typeof value !== "string") {
    return null;
  }

  return isFocusKey(value) ? value : null;
};
