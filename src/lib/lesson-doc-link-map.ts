import { extractGoogleDocIdFromUrl, LessonDocIdMap } from "@/lib/lesson-doc-links";
import { prisma } from "@/lib/prisma";

const LESSON_DOC_LINK_MAP_TTL_MS = 60 * 60 * 1000;

type LessonDocLinkCacheEntry = {
  map: LessonDocIdMap;
  expiresAt: number;
};

let lessonDocLinkCache: LessonDocLinkCacheEntry | null = null;
let lessonDocLinkInFlight: Promise<LessonDocIdMap> | null = null;

type LessonLinkRecord = {
  slug: string;
  publishedUrl: string;
  googleDocId: string | null;
  isArchived: boolean;
  supersededBy: { slug: string; isArchived: boolean } | null;
};

const resolveLessonSlug = (lesson: LessonLinkRecord) => {
  if (!lesson.isArchived) {
    return lesson.slug;
  }

  if (lesson.supersededBy && !lesson.supersededBy.isArchived) {
    return lesson.supersededBy.slug;
  }

  return null;
};

const buildLessonDocLinkMap = async () => {
  const lessons = await prisma.lesson.findMany({
    select: {
      slug: true,
      publishedUrl: true,
      googleDocId: true,
      isArchived: true,
      supersededBy: {
        select: {
          slug: true,
          isArchived: true,
        },
      },
    },
  });

  const map: LessonDocIdMap = new Map();
  for (const lesson of lessons) {
    const docId =
      lesson.googleDocId ?? extractGoogleDocIdFromUrl(lesson.publishedUrl);
    if (!docId) {
      continue;
    }

    const slug = resolveLessonSlug(lesson);
    if (!slug) {
      continue;
    }

    map.set(docId, slug);
  }

  return map;
};

export const getLessonDocLinkMap = async (
  options: { bypassCache?: boolean } = {}
) => {
  const { bypassCache = false } = options;
  const now = Date.now();

  if (
    !bypassCache &&
    lessonDocLinkCache &&
    lessonDocLinkCache.expiresAt > now
  ) {
    return lessonDocLinkCache.map;
  }

  if (!bypassCache && lessonDocLinkInFlight) {
    return lessonDocLinkInFlight;
  }

  const fetchPromise = buildLessonDocLinkMap().then((map) => {
    if (!bypassCache) {
      lessonDocLinkCache = {
        map,
        expiresAt: now + LESSON_DOC_LINK_MAP_TTL_MS,
      };
    }
    return map;
  });

  if (!bypassCache) {
    lessonDocLinkInFlight = fetchPromise;
  }

  try {
    return await fetchPromise;
  } finally {
    if (!bypassCache) {
      lessonDocLinkInFlight = null;
    }
  }
};

export const clearLessonDocLinkMapCache = () => {
  lessonDocLinkCache = null;
};
