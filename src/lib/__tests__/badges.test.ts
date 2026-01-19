import { describe, expect, it } from "vitest";

import { buildBadgeStatuses } from "@/lib/badges";
import type { RoadmapModule } from "@/components/roadmap-module-list";

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

const findBadge = (
  badges: ReturnType<typeof buildBadgeStatuses>,
  key: string
) => badges.find((badge) => badge.key === key);

describe("buildBadgeStatuses", () => {
  it("awards the explorer badge when core + role deep dive requirements are met", () => {
    const completed = [
      "explore-technology-jobs",
      "popular-tech-roles",
      "cs-courses-to-job-titles",
      "job-titles-to-cs-courses",
      "learn-about-ai-engineering",
      "learn-about-backend-engineering",
      "learn-about-data-engineering",
    ];

    const badges = buildBadgeStatuses(modules, completed);

    expect(findBadge(badges, "explorer")?.isEarned).toBe(true);
    expect(findBadge(badges, "pathfinder")?.isEarned).toBe(false);
  });

  it("awards extra credit and internship badges when thresholds are reached", () => {
    const completed = [
      "start-to-finish-roadmap",
      "tech-recruiting-timeline",
      "tech-career-stories",
      "learn-about-ai-engineering",
      "internship-success-handbook",
      "internship-success-checklist",
    ];

    const badges = buildBadgeStatuses(modules, completed);

    expect(findBadge(badges, "pathfinder")?.isEarned).toBe(true);
    expect(findBadge(badges, "internship-ready")?.isEarned).toBe(true);
    expect(findBadge(badges, "extra-credit-collector")?.isEarned).toBe(true);
    expect(findBadge(badges, "offer-confident")?.isEarned).toBe(false);
  });
});
