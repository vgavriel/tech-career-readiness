const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const {
  resolveExistingRecord,
  getLessonKey,
  collectLessonKeys,
} = require("./seed-utils");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const modules = [
  {
    key: "start-here",
    slug: "start-here",
    title: "Start Here",
    order: 1,
    description: "Begin with the Brown-specific roadmap and recruiting timeline.",
    lessons: [
      {
        title: "Start to Finish: The Roadmap to a Tech Internship or Job",
        slug: "start-to-finish-roadmap",
        order: 1,
      },
      {
        title: "Tech Recruiting Timeline",
        slug: "tech-recruiting-timeline",
        order: 2,
      },
      {
        title:
          "3 Short Stories to Illustrate the Tech Career Exploration Journey at Brown University",
        slug: "tech-career-stories",
        order: 3,
      },
      {
        title: "Your Tech Career Exploration Journey",
        slug: "tech-career-exploration-journey",
        order: 4,
      },
    ],
  },
  {
    key: "explore-roles",
    slug: "explore-roles",
    title: "Explore Roles",
    order: 2,
    description:
      "Survey tech roles, course maps, and Brown-specific role deep dives.",
    lessons: [
      {
        title: "Explore Various Technology Jobs and Fields",
        slug: "explore-technology-jobs",
        order: 1,
      },
      {
        title: "Popular Tech Roles",
        slug: "popular-tech-roles",
        order: 2,
      },
      {
        title: "Map of CS Courses to Job Titles",
        slug: "cs-courses-to-job-titles",
        order: 3,
      },
      {
        title: "Map of Job Titles to CS Courses",
        slug: "job-titles-to-cs-courses",
        order: 4,
      },
      {
        title: "Learn about AI Engineering",
        slug: "learn-about-ai-engineering",
        order: 5,
      },
      {
        title: "Learn about AR/VR Engineering",
        slug: "learn-about-ar-vr-engineering",
        order: 6,
      },
      {
        title: "Learn about Backend Engineering",
        slug: "learn-about-backend-engineering",
        order: 7,
      },
      {
        title: "Learn about Blockchain Engineering",
        slug: "learn-about-blockchain-engineering",
        order: 8,
      },
      {
        title: "Learn about Computer Vision Engineering",
        slug: "learn-about-computer-vision-engineering",
        order: 9,
      },
      {
        title: "Learn about Cybersecurity Analysts/Specialists",
        slug: "learn-about-cybersecurity-analysts-specialists",
        order: 10,
      },
      {
        title: "Learn about Cybersecurity Engineering",
        slug: "learn-about-cybersecurity-engineering",
        order: 11,
      },
      {
        title: "Learn about Data Engineering",
        slug: "learn-about-data-engineering",
        order: 12,
      },
      {
        title: "Learn about Data Science",
        slug: "learn-about-data-science",
        order: 13,
      },
      {
        title: "Learn about DevOps Engineering",
        slug: "learn-about-devops-engineering",
        order: 14,
      },
      {
        title: "Learn about Embedded Engineering",
        slug: "learn-about-embedded-engineering",
        order: 15,
      },
      {
        title: "Learn about Forward Deployed Engineering (FDE)",
        slug: "learn-about-forward-deployed-engineering",
        order: 16,
      },
      {
        title: "Learn about Frontend Engineering",
        slug: "learn-about-frontend-engineering",
        order: 17,
      },
      {
        title: "Learn about Full-Stack Engineering",
        slug: "learn-about-full-stack-engineering",
        order: 18,
      },
      {
        title: "Learn about Game Development",
        slug: "learn-about-game-development",
        order: 19,
      },
      {
        title: "Learn about Machine Learning (ML) Engineering",
        slug: "learn-about-machine-learning-engineering",
        order: 20,
      },
      {
        title: "Learn about Mobile App Engineering",
        slug: "learn-about-mobile-app-engineering",
        order: 21,
      },
      {
        title: "Learn about Product Management",
        slug: "learn-about-product-management",
        order: 22,
      },
      {
        title: "Learn about Quant Developers",
        slug: "learn-about-quant-developers",
        order: 23,
      },
      {
        title: "Learn about Quant Traders",
        slug: "learn-about-quant-traders",
        order: 24,
      },
      {
        title: "Learn about Site Reliability Engineering (SRE)",
        slug: "learn-about-site-reliability-engineering",
        order: 25,
      },
      {
        title: "Learn about UI/UX Design",
        slug: "learn-about-ui-ux-design",
        order: 26,
      },
      {
        title: "Learn about Web Development",
        slug: "learn-about-web-development",
        order: 27,
      },
    ],
  },
  {
    key: "build-experience",
    slug: "build-experience",
    title: "Build Experience",
    order: 3,
    description:
      "Build the projects, skills, and exposure that hiring teams expect.",
    lessons: [
      {
        title: "Build Experience to Get Tech Internships and New-Grad Jobs",
        slug: "build-experience",
        order: 1,
      },
    ],
  },
  {
    key: "opportunities-networking",
    slug: "opportunities-networking",
    title: "Find Opportunities & Network",
    order: 4,
    description: "Use job boards, outreach, and referrals to get interviews.",
    lessons: [
      {
        title: "Tech Internship and Job Boards",
        slug: "tech-internship-and-job-boards",
        order: 1,
      },
      {
        title: "Informational Interviewing & Networking Tipsheet for Tech",
        slug: "informational-interviewing-networking-tipsheet",
        order: 2,
      },
      {
        title: "Is Networking Worth It For Tech Jobs?",
        slug: "is-networking-worth-it",
        order: 3,
      },
      {
        title: "How to Network With Tech Recruiters",
        slug: "how-to-network-with-tech-recruiters",
        order: 4,
      },
    ],
  },
  {
    key: "research-companies",
    slug: "research-companies",
    title: "Research Companies",
    order: 5,
    description: "Align your applications with company values and roles.",
    lessons: [
      {
        title: "Researching Tech Companies and Understanding Core Values",
        slug: "research-tech-companies-core-values",
        order: 1,
      },
    ],
  },
  {
    key: "applications",
    slug: "applications",
    title: "Applications",
    order: 6,
    description: "Craft resumes and submissions that stand out quickly.",
    lessons: [
      {
        title: "Craft Winning Tech Job and Internship Applications",
        slug: "craft-winning-tech-applications",
        order: 1,
      },
      {
        title: "Tech Resume Example with Annotations",
        slug: "tech-resume-example",
        order: 2,
      },
      {
        title: "Examples: Quantify Impact on Tech Resumes",
        slug: "quantify-impact-on-resumes",
        order: 3,
      },
    ],
  },
  {
    key: "interviews",
    slug: "interviews",
    title: "Interviews",
    order: 7,
    description: "Prepare for technical, behavioral, and strategic interviews.",
    lessons: [
      {
        title: "Ace the Tech Interview: Your Ultimate Prep Timeline",
        slug: "ace-interview-prep-timeline",
        order: 1,
      },
      {
        title: "Ace the Tech Interview: Solve Coding Challenges with Confidence",
        slug: "ace-interview-coding-challenges",
        order: 2,
      },
      {
        title: "Ace the Tech Interview: Stand Out with Smart Questions",
        slug: "ace-interview-smart-questions",
        order: 3,
      },
    ],
  },
  {
    key: "offers",
    slug: "offers",
    title: "Offers",
    order: 8,
    description: "Evaluate and negotiate offers with confidence.",
    lessons: [
      {
        title: "Tech Job Offer Evaluation and Negotiation",
        slug: "offer-evaluation-negotiation",
        order: 1,
      },
      {
        title: "Tech Job Offer Evaluation and Negotiation Checklist",
        slug: "offer-evaluation-negotiation-checklist",
        order: 2,
      },
    ],
  },
  {
    key: "internship-success",
    slug: "internship-success",
    title: "Internship Success",
    order: 9,
    description: "Make the most of your internship from day one.",
    lessons: [
      {
        title: "Tech Internship Success Handbook",
        slug: "internship-success-handbook",
        order: 1,
      },
      {
        title: "Tech Internship Success Checklist",
        slug: "internship-success-checklist",
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
    const moduleByKey = await prisma.module.findUnique({
      where: { key: moduleData.key },
    });
    const moduleByOrder = await prisma.module.findFirst({
      where: { cohortId: defaultCohort.id, order: moduleData.order },
    });
    const { record: existingModule } = resolveExistingRecord({
      recordByKey: moduleByKey,
      recordByOrder: moduleByOrder,
    });

    const previousSlug = existingModule?.slug ?? null;

    const moduleRecord = existingModule
      ? await prisma.module.update({
          where: { id: existingModule.id },
          data: {
            key: moduleData.key,
            slug: moduleData.slug,
            title: moduleData.title,
            order: moduleData.order,
            description: moduleData.description,
            cohortId: defaultCohort.id,
          },
        })
      : await prisma.module.create({
          data: {
            key: moduleData.key,
            slug: moduleData.slug,
            title: moduleData.title,
            order: moduleData.order,
            description: moduleData.description,
            cohortId: defaultCohort.id,
          },
        });

    if (previousSlug && previousSlug !== moduleData.slug) {
      await prisma.moduleSlugAlias.upsert({
        where: { slug: previousSlug },
        update: { moduleId: moduleRecord.id },
        create: { slug: previousSlug, moduleId: moduleRecord.id },
      });
    }

    const aliases = moduleData.aliases ?? [];

    for (const alias of aliases) {
      if (alias === moduleData.slug) {
        continue;
      }

      await prisma.moduleSlugAlias.upsert({
        where: { slug: alias },
        update: { moduleId: moduleRecord.id },
        create: { slug: alias, moduleId: moduleRecord.id },
      });
    }

    for (const lessonData of moduleData.lessons) {
      const lessonKey = getLessonKey(lessonData);
      const publishedUrl =
        lessonData.publishedUrl ??
        `https://docs.google.com/document/d/e/${lessonData.slug}/pub`;

      const lessonByKey = await prisma.lesson.findUnique({
        where: { key: lessonKey },
      });
      const lessonByOrder = await prisma.lesson.findFirst({
        where: { moduleId: moduleRecord.id, order: lessonData.order },
      });
      const { record: existingLesson } = resolveExistingRecord({
        recordByKey: lessonByKey,
        recordByOrder: lessonByOrder,
      });

      const previousSlug = existingLesson?.slug ?? null;

      const lessonRecord = existingLesson
        ? await prisma.lesson.update({
            where: { id: existingLesson.id },
            data: {
              key: lessonKey,
              title: lessonData.title,
              slug: lessonData.slug,
              order: lessonData.order,
              moduleId: moduleRecord.id,
              publishedUrl,
              cohortId: defaultCohort.id,
              isArchived: false,
            },
          })
        : await prisma.lesson.create({
            data: {
              key: lessonKey,
              title: lessonData.title,
              slug: lessonData.slug,
              order: lessonData.order,
              moduleId: moduleRecord.id,
              publishedUrl,
              cohortId: defaultCohort.id,
              isArchived: false,
            },
          });

      if (previousSlug && previousSlug !== lessonData.slug) {
        await prisma.lessonSlugAlias.upsert({
          where: { slug: previousSlug },
          update: { lessonId: lessonRecord.id },
          create: { slug: previousSlug, lessonId: lessonRecord.id },
        });
      }

      const aliases = lessonData.aliases ?? [];
      for (const alias of aliases) {
        if (alias === lessonData.slug) {
          continue;
        }

        await prisma.lessonSlugAlias.upsert({
          where: { slug: alias },
          update: { lessonId: lessonRecord.id },
          create: { slug: alias, lessonId: lessonRecord.id },
        });
      }
    }

    const lessonKeys = collectLessonKeys(moduleData.lessons);

    await prisma.lesson.updateMany({
      where: {
        moduleId: moduleRecord.id,
        key: { notIn: lessonKeys },
      },
      data: { isArchived: true },
    });
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
