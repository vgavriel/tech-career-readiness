import type { RoadmapModule } from "@/components/roadmap-module-list";
import { getLessonClassification } from "@/lib/lesson-classification";

export type BadgeKey =
  | "pathfinder"
  | "explorer"
  | "connector"
  | "applicant"
  | "interview-ready"
  | "offer-confident"
  | "internship-ready"
  | "extra-credit-collector";

export type BadgeStatus = {
  key: BadgeKey;
  title: string;
  description: string;
  progressLabel: string;
  statusLabel: string;
  isEarned: boolean;
};

type LessonSummary = {
  id: string;
  key: string;
  slug: string;
  moduleKey: string;
  classification: ReturnType<typeof getLessonClassification>;
};

type LessonProgress = {
  total: number;
  completed: number;
  isComplete: boolean;
};

const buildLessonSummaries = (modules: RoadmapModule[]): LessonSummary[] =>
  modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      id: lesson.id,
      key: lesson.key,
      slug: lesson.slug,
      moduleKey: module.key,
      classification: getLessonClassification({
        key: lesson.key,
        slug: lesson.slug,
      }),
    }))
  );

const isLessonCompleted = (lesson: LessonSummary, completedSet: Set<string>) =>
  completedSet.has(lesson.key) || completedSet.has(lesson.id);

const summarizeLessons = (
  lessons: LessonSummary[],
  completedSet: Set<string>
): LessonProgress => {
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

const formatProgressLabel = (
  completed: number,
  total: number,
  label: string
) => {
  if (total === 0) {
    return `No ${label} yet`;
  }

  return `${completed} of ${total} ${label}`;
};

const getModuleProgress = (
  lessons: LessonSummary[],
  completedSet: Set<string>,
  moduleKey: string,
  options?: { includeExtra?: boolean }
) => {
  const includeExtra = options?.includeExtra ?? false;
  const moduleLessons = lessons.filter((lesson) => lesson.moduleKey === moduleKey);
  const filteredLessons = includeExtra
    ? moduleLessons
    : moduleLessons.filter((lesson) => lesson.classification.credit === "core");

  return summarizeLessons(filteredLessons, completedSet);
};

export const buildBadgeStatuses = (
  modules: RoadmapModule[],
  completedLessonKeys: string[]
): BadgeStatus[] => {
  const lessons = buildLessonSummaries(modules);
  const completedSet = new Set(completedLessonKeys);

  const startHere = getModuleProgress(lessons, completedSet, "start-here");
  const exploreRoles = getModuleProgress(lessons, completedSet, "explore-roles");
  const networking = getModuleProgress(
    lessons,
    completedSet,
    "opportunities-networking"
  );
  const applications = getModuleProgress(lessons, completedSet, "applications");
  const interviews = getModuleProgress(lessons, completedSet, "interviews");
  const offers = getModuleProgress(lessons, completedSet, "offers");
  const internship = getModuleProgress(lessons, completedSet, "internship-success", {
    includeExtra: true,
  });

  const roleDeepDives = lessons.filter(
    (lesson) => lesson.classification.roleDeepDive
  );
  const roleDeepDiveProgress = summarizeLessons(roleDeepDives, completedSet);
  const roleDeepDiveTarget = 3;

  const extraCreditLessons = lessons.filter(
    (lesson) => lesson.classification.credit === "extra"
  );
  const extraCreditProgress = summarizeLessons(extraCreditLessons, completedSet);
  const extraCreditTarget =
    extraCreditProgress.total === 0
      ? 0
      : Math.ceil(extraCreditProgress.total * 0.5);

  const explorerEarned =
    exploreRoles.isComplete &&
    roleDeepDiveProgress.completed >= roleDeepDiveTarget;

  return [
    {
      key: "pathfinder",
      title: "Pathfinder",
      description: "Complete the Start Here core lessons.",
      progressLabel: formatProgressLabel(
        startHere.completed,
        startHere.total,
        "core lessons"
      ),
      statusLabel: startHere.isComplete ? "Earned" : "In progress",
      isEarned: startHere.isComplete,
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
    },
    {
      key: "connector",
      title: "Connector",
      description: "Complete the networking core lessons.",
      progressLabel: formatProgressLabel(
        networking.completed,
        networking.total,
        "core lessons"
      ),
      statusLabel: networking.isComplete ? "Earned" : "In progress",
      isEarned: networking.isComplete,
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
    },
    {
      key: "interview-ready",
      title: "Interview Ready",
      description: "Complete the interview prep core lessons.",
      progressLabel: formatProgressLabel(
        interviews.completed,
        interviews.total,
        "core lessons"
      ),
      statusLabel: interviews.isComplete ? "Earned" : "In progress",
      isEarned: interviews.isComplete,
    },
    {
      key: "offer-confident",
      title: "Offer Confident",
      description: "Complete the offers core lessons.",
      progressLabel: formatProgressLabel(
        offers.completed,
        offers.total,
        "core lessons"
      ),
      statusLabel: offers.isComplete ? "Earned" : "In progress",
      isEarned: offers.isComplete,
    },
    {
      key: "internship-ready",
      title: "Internship Ready",
      description: "Complete the internship success lessons.",
      progressLabel: formatProgressLabel(
        internship.completed,
        internship.total,
        "lessons"
      ),
      statusLabel: internship.isComplete ? "Earned" : "In progress",
      isEarned: internship.isComplete,
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
      statusLabel:
        extraCreditProgress.total > 0 &&
        extraCreditProgress.completed >= extraCreditTarget
          ? "Earned"
          : "In progress",
      isEarned:
        extraCreditProgress.total > 0 &&
        extraCreditProgress.completed >= extraCreditTarget,
    },
  ];
};
