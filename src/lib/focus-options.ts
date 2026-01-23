export type FocusKey =
  | "just-starting"
  | "applying-soon"
  | "interviewing-soon"
  | "offer-in-hand";

export type FocusOption = {
  key: FocusKey;
  label: string;
  description: string;
};

export const FOCUS_QUERY_PARAM = "focus";

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

export const isFocusKey = (value: string): value is FocusKey =>
  focusKeySet.has(value as FocusKey);

export const normalizeFocusKey = (value: unknown): FocusKey | null => {
  if (typeof value !== "string") {
    return null;
  }

  return isFocusKey(value) ? value : null;
};
