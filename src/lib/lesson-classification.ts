/**
 * Credit category for a lesson.
 */
export type LessonCredit = "core" | "extra";

/**
 * Classification metadata for a lesson.
 */
export type LessonClassification = {
  credit: LessonCredit;
  roleDeepDive: boolean;
};

/**
 * Classification result with mapping status.
 */
export type LessonClassificationResult = LessonClassification & {
  isMapped: boolean;
};

/**
 * Slugs that represent role deep-dive lessons.
 */
export const ROLE_DEEP_DIVE_LESSON_SLUGS = [
  "learn-about-ai-engineering",
  "learn-about-ar-vr-engineering",
  "learn-about-backend-engineering",
  "learn-about-blockchain-engineering",
  "learn-about-computer-vision-engineering",
  "learn-about-cybersecurity-analysts-specialists",
  "learn-about-cybersecurity-engineering",
  "learn-about-data-engineering",
  "learn-about-data-science",
  "learn-about-devops-engineering",
  "learn-about-embedded-engineering",
  "learn-about-forward-deployed-engineering",
  "learn-about-frontend-engineering",
  "learn-about-full-stack-engineering",
  "learn-about-game-development",
  "learn-about-machine-learning-engineering",
  "learn-about-mobile-app-engineering",
  "learn-about-product-management",
  "learn-about-quant-developers",
  "learn-about-quant-traders",
  "learn-about-site-reliability-engineering",
  "learn-about-ui-ux-design",
  "learn-about-web-development",
];

const EXTRA_CREDIT_LESSON_SLUGS = [
  "tech-career-stories",
  "internship-success-handbook",
  "internship-success-checklist",
  ...ROLE_DEEP_DIVE_LESSON_SLUGS,
];

const CORE_LESSON_SLUGS = [
  "start-to-finish-roadmap",
  "tech-recruiting-timeline",
  "explore-technology-jobs",
  "popular-tech-roles",
  "cs-courses-to-job-titles",
  "job-titles-to-cs-courses",
  "build-experience",
  "tech-internship-and-job-boards",
  "informational-interviewing-networking-tipsheet",
  "is-networking-worth-it",
  "how-to-network-with-tech-recruiters",
  "research-tech-companies-core-values",
  "craft-winning-tech-applications",
  "tech-resume-example",
  "quantify-impact-on-resumes",
  "ace-interview-prep-timeline",
  "ace-interview-coding-challenges",
  "ace-interview-smart-questions",
  "offer-evaluation-negotiation",
  "offer-evaluation-negotiation-checklist",
];

const ROLE_DEEP_DIVE_SET = new Set(ROLE_DEEP_DIVE_LESSON_SLUGS);

/**
 * In-memory lookup table of lesson slug to classification.
 */
export const LESSON_CLASSIFICATIONS: Record<string, LessonClassification> = {};

for (const slug of CORE_LESSON_SLUGS) {
  LESSON_CLASSIFICATIONS[slug] = { credit: "core", roleDeepDive: false };
}

for (const slug of EXTRA_CREDIT_LESSON_SLUGS) {
  LESSON_CLASSIFICATIONS[slug] = {
    credit: "extra",
    roleDeepDive: ROLE_DEEP_DIVE_SET.has(slug),
  };
}

const DEFAULT_CLASSIFICATION: LessonClassificationResult = {
  credit: "core",
  roleDeepDive: false,
  isMapped: false,
};

/**
 * Look up a classification entry by slug.
 */
const lookupClassification = (key?: string | null) =>
  key ? LESSON_CLASSIFICATIONS[key] : undefined;

/**
 * Resolve a lesson's classification, returning a default when unmapped.
 */
export const getLessonClassification = (lesson: {
  slug?: string | null;
}): LessonClassificationResult => {
  const bySlug = lookupClassification(lesson.slug);
  if (bySlug) {
    return { ...bySlug, isMapped: true };
  }

  return DEFAULT_CLASSIFICATION;
};

/**
 * Test whether a lesson is extra credit.
 */
export const isExtraCreditLesson = (lesson: { slug?: string | null }) =>
  getLessonClassification(lesson).credit === "extra";

/**
 * Test whether a lesson is a role deep-dive.
 */
export const isRoleDeepDiveLesson = (lesson: { slug?: string | null }) =>
  getLessonClassification(lesson).roleDeepDive;
