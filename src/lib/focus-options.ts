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
    description: "Map roles, build clarity, and start the core sequence.",
  },
  {
    key: "applying-soon",
    label: "Applying soon",
    timing: "1-2 weeks",
    description: "Sharpen your resume, outreach, and targeted applications.",
  },
  {
    key: "interviewing-soon",
    label: "Interviewing soon",
    timing: "Next up",
    description: "Practice interviews, research companies, and tighten stories.",
  },
  {
    key: "offer-in-hand",
    label: "Offer in hand",
    timing: "Decision",
    description: "Evaluate the offer, negotiate, and prep for onboarding.",
  },
];

export const buildFocusHref = (focusKey: FocusKey) =>
  `/roadmap?${FOCUS_QUERY_PARAM}=${focusKey}`;
