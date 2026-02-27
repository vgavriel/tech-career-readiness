/**
 * Lesson metadata used across roadmap and progress features.
 */
export type RoadmapLesson = {
  id: string;
  slug: string;
  title: string;
  order: number;
  estimatedMinutes: number | null;
};

/**
 * Module metadata used across roadmap and progress features.
 */
export type RoadmapModule = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  order: number;
  lessons: RoadmapLesson[];
};
