const resolveExistingRecord = ({ recordBySlug, recordByOrder }) => {
  if (recordBySlug) {
    return { record: recordBySlug, reason: "slug" };
  }
  if (recordByOrder) {
    return { record: recordByOrder, reason: "order" };
  }
  return { record: null, reason: "create" };
};

const getLessonSlug = (lessonData) => lessonData.slug;

const collectLessonSlugs = (lessons) => lessons.map(getLessonSlug);

module.exports = {
  resolveExistingRecord,
  getLessonSlug,
  collectLessonSlugs,
};
