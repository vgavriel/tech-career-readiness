const resolveExistingRecord = ({ recordByKey, recordByOrder }) => {
  if (recordByKey) {
    return { record: recordByKey, reason: "key" };
  }
  if (recordByOrder) {
    return { record: recordByOrder, reason: "order" };
  }
  return { record: null, reason: "create" };
};

const getLessonKey = (lessonData) => lessonData.key ?? lessonData.slug;

const collectLessonKeys = (lessons) => lessons.map(getLessonKey);

module.exports = {
  resolveExistingRecord,
  getLessonKey,
  collectLessonKeys,
};
