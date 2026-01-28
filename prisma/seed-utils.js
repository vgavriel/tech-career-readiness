/**
 * Resolve an existing record, preferring slug matches over order matches.
 */
const resolveExistingRecord = ({ recordBySlug, recordByOrder }) => {
  if (recordBySlug) {
    return { record: recordBySlug, reason: "slug" };
  }
  if (recordByOrder) {
    return { record: recordByOrder, reason: "order" };
  }
  return { record: null, reason: "create" };
};

/**
 * Return the slug for a lesson payload.
 */
const getLessonSlug = (lessonData) => lessonData.slug;

/**
 * Collect lesson slugs from a lesson list in-order.
 */
const collectLessonSlugs = (lessons) => lessons.map(getLessonSlug);

module.exports = {
  resolveExistingRecord,
  getLessonSlug,
  collectLessonSlugs,
};
