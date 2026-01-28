const { createSeedClient, seedDatabase } = require("./seed");

const TEST_LESSON = {
  title: "Lesson Content Error (Test)",
  slug: "lesson-content-error-test",
  publishedUrl: "https://example.com/lesson-content-error-test",
  order: 999,
  estimatedMinutes: 1,
  moduleKey: "start-here",
};

/**
 * Upsert the test-only lesson content error record.
 */
async function seedTestLesson(prisma) {
  const moduleRecord = await prisma.module.findUnique({
    where: { key: TEST_LESSON.moduleKey },
    select: { id: true },
  });

  if (!moduleRecord) {
    throw new Error(`Missing module for test seed: ${TEST_LESSON.moduleKey}`);
  }

  const existingLesson = await prisma.lesson.findUnique({
    where: { slug: TEST_LESSON.slug },
    select: { id: true },
  });

  const data = {
    title: TEST_LESSON.title,
    slug: TEST_LESSON.slug,
    order: TEST_LESSON.order,
    estimatedMinutes: TEST_LESSON.estimatedMinutes,
    moduleId: moduleRecord.id,
    publishedUrl: TEST_LESSON.publishedUrl,
    isArchived: false,
  };

  if (existingLesson) {
    await prisma.lesson.update({
      where: { id: existingLesson.id },
      data,
    });
    return;
  }

  await prisma.lesson.create({ data });
}

/**
 * Run the standard seed plus test-only lesson creation.
 */
async function runSeed() {
  const { prisma, pool } = createSeedClient();
  try {
    await seedDatabase(prisma);
    await seedTestLesson(prisma);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

if (require.main === module) {
  runSeed().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runSeed };
