import { describe, expect, it } from "vitest";

import type { RoadmapModule } from "@/components/roadmap-module-list";
import { buildGoldStarStatuses } from "@/lib/gold-stars";

const makeLesson = (slug: string, order: number) => ({
  id: slug,
  slug,
  title: slug.replace(/-/g, " "),
  order,
  estimatedMinutes: null,
});

const modules: RoadmapModule[] = [
  {
    id: "module-start",
    key: "start-here",
    title: "Start here",
    description: null,
    order: 1,
    lessons: [
      makeLesson("start-to-finish-roadmap", 1),
      makeLesson("tech-recruiting-timeline", 2),
      makeLesson("tech-career-stories", 3),
    ],
  },
  {
    id: "module-roles",
    key: "explore-roles",
    title: "Explore roles",
    description: null,
    order: 2,
    lessons: [
      makeLesson("explore-technology-jobs", 1),
      makeLesson("popular-tech-roles", 2),
      makeLesson("cs-courses-to-job-titles", 3),
      makeLesson("job-titles-to-cs-courses", 4),
      makeLesson("learn-about-ai-engineering", 5),
      makeLesson("learn-about-backend-engineering", 6),
      makeLesson("learn-about-data-engineering", 7),
    ],
  },
  {
    id: "module-networking",
    key: "opportunities-networking",
    title: "Networking",
    description: null,
    order: 3,
    lessons: [makeLesson("tech-internship-and-job-boards", 1)],
  },
  {
    id: "module-applications",
    key: "applications",
    title: "Applications",
    description: null,
    order: 4,
    lessons: [makeLesson("craft-winning-tech-applications", 1)],
  },
  {
    id: "module-interviews",
    key: "interviews",
    title: "Interviews",
    description: null,
    order: 5,
    lessons: [makeLesson("ace-interview-prep-timeline", 1)],
  },
  {
    id: "module-offers",
    key: "offers",
    title: "Offers",
    description: null,
    order: 6,
    lessons: [makeLesson("offer-evaluation-negotiation", 1)],
  },
  {
    id: "module-internship",
    key: "internship-success",
    title: "Internship success",
    description: null,
    order: 7,
    lessons: [
      makeLesson("internship-success-handbook", 1),
      makeLesson("internship-success-checklist", 2),
    ],
  },
];

const findGoldStar = (goldStars: ReturnType<typeof buildGoldStarStatuses>, key: string) =>
  goldStars.find((star) => star.key === key);

describe("buildGoldStarStatuses", () => {
  it("awards the explorer gold star when core + role deep dive requirements are met", () => {
    const completed = [
      "explore-technology-jobs",
      "popular-tech-roles",
      "cs-courses-to-job-titles",
      "job-titles-to-cs-courses",
      "learn-about-ai-engineering",
      "learn-about-backend-engineering",
      "learn-about-data-engineering",
    ];

    const goldStars = buildGoldStarStatuses(modules, completed);

    expect(findGoldStar(goldStars, "explorer")?.isEarned).toBe(true);
    expect(findGoldStar(goldStars, "pathfinder")?.isEarned).toBe(false);
  });

  it("awards extra credit and internship gold stars when thresholds are reached", () => {
    const completed = [
      "start-to-finish-roadmap",
      "tech-recruiting-timeline",
      "tech-career-stories",
      "learn-about-ai-engineering",
      "internship-success-handbook",
      "internship-success-checklist",
    ];

    const goldStars = buildGoldStarStatuses(modules, completed);

    expect(findGoldStar(goldStars, "pathfinder")?.isEarned).toBe(true);
    expect(findGoldStar(goldStars, "internship-ready")?.isEarned).toBe(true);
    expect(findGoldStar(goldStars, "extra-credit-collector")?.isEarned).toBe(true);
    expect(findGoldStar(goldStars, "offer-confident")?.isEarned).toBe(false);
  });

  it("targets the first incomplete lesson for an in-progress gold star", () => {
    const completed = ["start-to-finish-roadmap"];

    const goldStars = buildGoldStarStatuses(modules, completed);

    expect(findGoldStar(goldStars, "pathfinder")?.targetLessonSlug).toBe(
      "tech-recruiting-timeline"
    );
  });

  it("targets the first lesson for an earned gold star", () => {
    const completed = ["start-to-finish-roadmap", "tech-recruiting-timeline"];

    const goldStars = buildGoldStarStatuses(modules, completed);

    expect(findGoldStar(goldStars, "pathfinder")?.targetLessonSlug).toBe("start-to-finish-roadmap");
  });

  it("targets the first remaining core lesson before deep dives for explorer progress", () => {
    const completed = ["explore-technology-jobs", "popular-tech-roles"];

    const goldStars = buildGoldStarStatuses(modules, completed);

    expect(findGoldStar(goldStars, "explorer")?.targetLessonSlug).toBe("cs-courses-to-job-titles");
  });

  it("targets the first deep dive once all explorer core lessons are complete", () => {
    const completed = [
      "explore-technology-jobs",
      "popular-tech-roles",
      "cs-courses-to-job-titles",
      "job-titles-to-cs-courses",
    ];

    const goldStars = buildGoldStarStatuses(modules, completed);

    expect(findGoldStar(goldStars, "explorer")?.targetLessonSlug).toBe(
      "learn-about-ai-engineering"
    );
  });

  it("targets the first extra credit lesson until the threshold is earned", () => {
    const completed: string[] = [];

    const goldStars = buildGoldStarStatuses(modules, completed);

    expect(findGoldStar(goldStars, "extra-credit-collector")?.targetLessonSlug).toBe(
      "tech-career-stories"
    );
  });

  it("targets the first extra credit lesson even after earning extra credit", () => {
    const completed = [
      "tech-career-stories",
      "learn-about-ai-engineering",
      "internship-success-handbook",
      "internship-success-checklist",
    ];

    const goldStars = buildGoldStarStatuses(modules, completed);

    expect(findGoldStar(goldStars, "extra-credit-collector")?.targetLessonSlug).toBe(
      "tech-career-stories"
    );
  });

  it("returns null targets when a gold star has no lessons", () => {
    const customModules: RoadmapModule[] = [
      {
        id: "module-empty",
        key: "offers",
        title: "Offers",
        description: null,
        order: 1,
        lessons: [],
      },
    ];

    const goldStars = buildGoldStarStatuses(customModules, []);

    expect(findGoldStar(goldStars, "offer-confident")?.targetLessonSlug).toBeNull();
  });
});
