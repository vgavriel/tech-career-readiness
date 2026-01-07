const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const modules = [
  {
    title: "Foundations & Mindset",
    order: 1,
    description: "Clarify your target and build a sustainable job-search routine.",
    lessons: [
      {
        title: "Define Your Goal",
        slug: "define-your-goal",
        order: 1,
      },
      {
        title: "Set a Weekly System",
        slug: "set-a-weekly-system",
        order: 2,
      },
    ],
  },
  {
    title: "Research & Targeting",
    order: 2,
    description: "Pick roles and companies with focus instead of applying everywhere.",
    lessons: [
      {
        title: "Identify Target Roles",
        slug: "identify-target-roles",
        order: 1,
      },
      {
        title: "Build Your Company List",
        slug: "build-your-company-list",
        order: 2,
      },
    ],
  },
  {
    title: "Resume & Portfolio",
    order: 3,
    description: "Craft assets that get past screens and start conversations.",
    lessons: [
      {
        title: "Resume Basics",
        slug: "resume-basics",
        order: 1,
      },
      {
        title: "Portfolio Checklist",
        slug: "portfolio-checklist",
        order: 2,
      },
    ],
  },
  {
    title: "Networking & Outreach",
    order: 4,
    description: "Build relationships that turn into referrals and interviews.",
    lessons: [
      {
        title: "Sharpen Your LinkedIn",
        slug: "sharpen-your-linkedin",
        order: 1,
      },
      {
        title: "Write Outreach Messages",
        slug: "write-outreach-messages",
        order: 2,
      },
    ],
  },
  {
    title: "Interview Prep",
    order: 5,
    description: "Practice technical and behavioral interviews with structure.",
    lessons: [
      {
        title: "Technical Prep Plan",
        slug: "technical-prep-plan",
        order: 1,
      },
      {
        title: "Behavioral Story Bank",
        slug: "behavioral-story-bank",
        order: 2,
      },
    ],
  },
  {
    title: "Applications & Tracking",
    order: 6,
    description: "Apply intentionally and measure your pipeline.",
    lessons: [
      {
        title: "Application Sprint",
        slug: "application-sprint",
        order: 1,
      },
      {
        title: "Track Your Progress",
        slug: "track-your-progress",
        order: 2,
      },
    ],
  },
  {
    title: "Offer & Negotiation",
    order: 7,
    description: "Evaluate offers and negotiate with confidence.",
    lessons: [
      {
        title: "Evaluate Your Offer",
        slug: "evaluate-your-offer",
        order: 1,
      },
      {
        title: "Negotiate Confidently",
        slug: "negotiate-confidently",
        order: 2,
      },
    ],
  },
];

async function main() {
  const defaultCohort = await prisma.cohort.upsert({
    where: { slug: "default" },
    update: { name: "Default", isDefault: true },
    create: { name: "Default", slug: "default", isDefault: true },
  });

  for (const moduleData of modules) {
    const existingModule = await prisma.module.findFirst({
      where: {
        title: moduleData.title,
        cohortId: defaultCohort.id,
      },
    });

    const moduleRecord = existingModule
      ? await prisma.module.update({
          where: { id: existingModule.id },
          data: {
            title: moduleData.title,
            order: moduleData.order,
            description: moduleData.description,
            cohortId: defaultCohort.id,
          },
        })
      : await prisma.module.create({
          data: {
            title: moduleData.title,
            order: moduleData.order,
            description: moduleData.description,
            cohortId: defaultCohort.id,
          },
        });

    for (const lessonData of moduleData.lessons) {
      const publishedUrl = `https://example.com/lessons/${lessonData.slug}`;

      await prisma.lesson.upsert({
        where: { slug: lessonData.slug },
        update: {
          title: lessonData.title,
          order: lessonData.order,
          moduleId: moduleRecord.id,
          publishedUrl,
          cohortId: defaultCohort.id,
        },
        create: {
          title: lessonData.title,
          slug: lessonData.slug,
          order: lessonData.order,
          moduleId: moduleRecord.id,
          publishedUrl,
          cohortId: defaultCohort.id,
        },
      });
    }
  }
}

async function shutdown() {
  await prisma.$disconnect();
  await pool.end();
}

main()
  .then(shutdown)
  .catch(async (error) => {
    console.error(error);
    await shutdown();
    process.exit(1);
  });
