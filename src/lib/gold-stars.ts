import type { RoadmapModule } from "@/components/roadmap-module-list";
import { getLessonClassification } from "@/lib/lesson-classification";

/**
 * Canonical gold star identifiers.
 */
export type GoldStarKey =
  | "pathfinder"
  | "explorer"
  | "connector"
  | "applicant"
  | "interview-ready"
  | "offer-confident"
  | "internship-ready"
  | "extra-credit-collector";

/**
 * UI-ready gold star status details.
 */
export type GoldStarStatus = {
  key: GoldStarKey;
  title: string;
  description: string;
  progressLabel: string;
  statusLabel: string;
  isEarned: boolean;
  targetLessonSlug: string | null;
};

type LessonSummary = {
  slug: string;
  moduleKey: string;
  moduleOrder: number;
  order: number;
  classification: ReturnType<typeof getLessonClassification>;
};

type LessonProgress = {
  total: number;
  completed: number;
  isComplete: boolean;
};

/**
 * Flatten module lessons into summaries with classification metadata.
 */
const buildLessonSummaries = (modules: RoadmapModule[]): LessonSummary[] => {
  const orderedModules = [...modules].sort((left, right) => left.order - right.order);

  return orderedModules.flatMap((module) => {
    const orderedLessons = [...module.lessons].sort((left, right) => left.order - right.order);

    return orderedLessons.map((lesson) => ({
      slug: lesson.slug,
      moduleKey: module.key,
      moduleOrder: module.order,
      order: lesson.order,
      classification: getLessonClassification({
        slug: lesson.slug,
      }),
    }));
  });
};

/**
 * Determine whether a lesson appears in the completed set.
 */
const isLessonCompleted = (lesson: LessonSummary, completedSet: Set<string>) =>
  completedSet.has(lesson.slug);

/**
 * Summarize completion counts for a lesson list.
 */
const summarizeLessons = (lessons: LessonSummary[], completedSet: Set<string>): LessonProgress => {
  const completed = lessons.reduce(
    (count, lesson) => count + (isLessonCompleted(lesson, completedSet) ? 1 : 0),
    0
  );
  const total = lessons.length;

  return {
    total,
    completed,
    isComplete: total > 0 && completed >= total,
  };
};

/**
 * Sort lessons by module then lesson order.
 */
const sortLessons = (lessons: LessonSummary[]) =>
  [...lessons].sort(
    (left, right) =>
      left.moduleOrder - right.moduleOrder ||
      left.order - right.order ||
      left.slug.localeCompare(right.slug)
  );

/**
 * Return ordered lessons for a module, optionally including extra credit.
 */
const getModuleLessons = (
  lessons: LessonSummary[],
  moduleKey: string,
  options?: { includeExtra?: boolean }
) => {
  const includeExtra = options?.includeExtra ?? false;
  const moduleLessons = lessons.filter((lesson) => lesson.moduleKey === moduleKey);
  const filteredLessons = includeExtra
    ? moduleLessons
    : moduleLessons.filter((lesson) => lesson.classification.credit === "core");

  return sortLessons(filteredLessons);
};

/**
 * Format a progress label used in gold star UI strings.
 */
const formatProgressLabel = (completed: number, total: number, label: string) => {
  if (total === 0) {
    return `No ${label} yet`;
  }

  return `${completed} of ${total} ${label}`;
};

/**
 * Compute module progress, optionally including extra credit lessons.
 */
const getModuleProgress = (
  lessons: LessonSummary[],
  completedSet: Set<string>,
  moduleKey: string,
  options?: { includeExtra?: boolean }
) => {
  const filteredLessons = getModuleLessons(lessons, moduleKey, options);
  return summarizeLessons(filteredLessons, completedSet);
};

/**
 * Pick the lesson slug to use for a gold star CTA.
 */
const getGoldStarTargetSlug = (
  lessons: LessonSummary[],
  completedSet: Set<string>,
  isEarned: boolean
) => {
  if (lessons.length === 0) {
    return null;
  }

  if (isEarned) {
    return lessons[0].slug;
  }

  const nextLesson = lessons.find((lesson) => !completedSet.has(lesson.slug));
  return nextLesson ? nextLesson.slug : null;
};

/**
 * Build gold star status objects based on completed lessons.
 *
 * Explorer requires all core explore-roles lessons plus 3 deep dives; extra
 * credit requires at least 50% of extra lessons completed.
 */
export const buildGoldStarStatuses = (
  modules: RoadmapModule[],
  completedLessonSlugs: string[]
): GoldStarStatus[] => {
  const lessons = buildLessonSummaries(modules);
  const completedSet = new Set(completedLessonSlugs);

  const startHereLessons = getModuleLessons(lessons, "start-here");
  const exploreCoreLessons = getModuleLessons(lessons, "explore-roles");
  const networkingLessons = getModuleLessons(lessons, "opportunities-networking");
  const applicationsLessons = getModuleLessons(lessons, "applications");
  const interviewsLessons = getModuleLessons(lessons, "interviews");
  const offersLessons = getModuleLessons(lessons, "offers");
  const internshipLessons = getModuleLessons(lessons, "internship-success", {
    includeExtra: true,
  });

  const roleDeepDives = sortLessons(lessons.filter((lesson) => lesson.classification.roleDeepDive));
  const roleDeepDiveProgress = summarizeLessons(roleDeepDives, completedSet);
  const roleDeepDiveTarget = 3;

  const extraCreditLessons = sortLessons(
    lessons.filter((lesson) => lesson.classification.credit === "extra")
  );
  const extraCreditProgress = summarizeLessons(extraCreditLessons, completedSet);
  const extraCreditTarget =
    extraCreditProgress.total === 0 ? 0 : Math.ceil(extraCreditProgress.total * 0.5);

  const startHere = summarizeLessons(startHereLessons, completedSet);
  const exploreRoles = summarizeLessons(exploreCoreLessons, completedSet);
  const networking = summarizeLessons(networkingLessons, completedSet);
  const applications = summarizeLessons(applicationsLessons, completedSet);
  const interviews = summarizeLessons(interviewsLessons, completedSet);
  const offers = summarizeLessons(offersLessons, completedSet);
  const internship = summarizeLessons(internshipLessons, completedSet);

  const explorerEarned =
    exploreRoles.isComplete && roleDeepDiveProgress.completed >= roleDeepDiveTarget;
  const explorerLessons = sortLessons([...exploreCoreLessons, ...roleDeepDives]);
  const extraCreditEarned =
    extraCreditProgress.total > 0 && extraCreditProgress.completed >= extraCreditTarget;

  return [
    {
      key: "pathfinder",
      title: "Pathfinder",
      description: "Complete the Start Here core lessons.",
      progressLabel: formatProgressLabel(startHere.completed, startHere.total, "core lessons"),
      statusLabel: startHere.isComplete ? "Earned" : "In progress",
      isEarned: startHere.isComplete,
      targetLessonSlug: getGoldStarTargetSlug(startHereLessons, completedSet, startHere.isComplete),
    },
    {
      key: "explorer",
      title: "Explorer",
      description: "Finish Explore Roles core lessons + 3 role deep dives.",
      progressLabel: `Core ${formatProgressLabel(
        exploreRoles.completed,
        exploreRoles.total,
        "lessons"
      )} · Deep dives ${roleDeepDiveProgress.completed} of ${roleDeepDiveTarget}`,
      statusLabel: explorerEarned ? "Earned" : "In progress",
      isEarned: explorerEarned,
      targetLessonSlug: getGoldStarTargetSlug(explorerLessons, completedSet, explorerEarned),
    },
    {
      key: "connector",
      title: "Connector",
      description: "Complete the networking core lessons.",
      progressLabel: formatProgressLabel(networking.completed, networking.total, "core lessons"),
      statusLabel: networking.isComplete ? "Earned" : "In progress",
      isEarned: networking.isComplete,
      targetLessonSlug: getGoldStarTargetSlug(
        networkingLessons,
        completedSet,
        networking.isComplete
      ),
    },
    {
      key: "applicant",
      title: "Applicant",
      description: "Complete the applications core lessons.",
      progressLabel: formatProgressLabel(
        applications.completed,
        applications.total,
        "core lessons"
      ),
      statusLabel: applications.isComplete ? "Earned" : "In progress",
      isEarned: applications.isComplete,
      targetLessonSlug: getGoldStarTargetSlug(
        applicationsLessons,
        completedSet,
        applications.isComplete
      ),
    },
    {
      key: "interview-ready",
      title: "Interview Ready",
      description: "Complete the interview prep core lessons.",
      progressLabel: formatProgressLabel(interviews.completed, interviews.total, "core lessons"),
      statusLabel: interviews.isComplete ? "Earned" : "In progress",
      isEarned: interviews.isComplete,
      targetLessonSlug: getGoldStarTargetSlug(
        interviewsLessons,
        completedSet,
        interviews.isComplete
      ),
    },
    {
      key: "offer-confident",
      title: "Offer Confident",
      description: "Complete the offers core lessons.",
      progressLabel: formatProgressLabel(offers.completed, offers.total, "core lessons"),
      statusLabel: offers.isComplete ? "Earned" : "In progress",
      isEarned: offers.isComplete,
      targetLessonSlug: getGoldStarTargetSlug(offersLessons, completedSet, offers.isComplete),
    },
    {
      key: "internship-ready",
      title: "Internship Ready",
      description: "Complete the internship success lessons.",
      progressLabel: formatProgressLabel(internship.completed, internship.total, "lessons"),
      statusLabel: internship.isComplete ? "Earned" : "In progress",
      isEarned: internship.isComplete,
      targetLessonSlug: getGoldStarTargetSlug(
        internshipLessons,
        completedSet,
        internship.isComplete
      ),
    },
    {
      key: "extra-credit-collector",
      title: "Extra Credit Collector",
      description: "Complete at least 50% of extra credit lessons.",
      progressLabel: formatProgressLabel(
        extraCreditProgress.completed,
        extraCreditProgress.total,
        "extra lessons"
      ),
      statusLabel: extraCreditEarned ? "Earned" : "In progress",
      isEarned: extraCreditEarned,
      targetLessonSlug: getGoldStarTargetSlug(extraCreditLessons, completedSet, extraCreditEarned),
    },
  ];
};
