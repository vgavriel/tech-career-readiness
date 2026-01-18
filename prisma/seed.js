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
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRWVi28NTFDO-AAERit3UOTaYX7YfBnpCv-tsJVOEOp5fzhrliW1GzLuMz8FDCm1qrn6YkRHVy4uGLX/pub",
        order: 1,
      },
      {
        title: "Tech Recruiting Timeline",
        slug: "tech-recruiting-timeline",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTHH1jcNhUKgeV4KLJ7cwzzD3ayIjdp8gD_7KK5DPLRJ6uJIEgONJSiTbBh3zzlFvC_7HPIhW9tOGnE/pub",
        order: 2,
      },
      {
        title:
          "3 Short Stories to Illustrate the Tech Career Exploration Journey at Brown University",
        slug: "tech-career-stories",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTyuE0viX0FlrN-9-sBWRLXlQ8L_igcRe6Kp3K9HuXCRkPmcQPQzkZUvQ_OuuaXh3UV17cXegspmMBZ/pub",
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
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRuv0GCUAiihHrN8KmMlvT9UcdGEDrivlOfmEBo1gRDFT_m0hfK43zXE1ZUgnOSqYG1YVATyBwYuvoz/pub",
        order: 1,
      },
      {
        title: "Popular Tech Roles",
        slug: "popular-tech-roles",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSf74z7c8Eqi2jlFamzSaQOOfUvPxTaFNiz7lugIsl8CyAGDHATfFr-y9nz3_j_B81EQYrWh-NfZ1Be/pub",
        order: 2,
      },
      {
        title: "Map of CS Courses to Job Titles",
        slug: "cs-courses-to-job-titles",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQRiteLjqeiGRO_rYcW73NkV9zUH5-9lATBWnZj4eG9UecnBAzjTZHvF2QrgeDHCqnlnoqLOju9g3_r/pub",
        order: 3,
      },
      {
        title: "Map of Job Titles to CS Courses",
        slug: "job-titles-to-cs-courses",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTezgLn6qALqRCjVz28Ii71wkNe7AqqQPdJJkthbb_nphfdXK9IMX_6MAwbMmoBGMaNfDYq0ZRVm-GQ/pub",
        order: 4,
      },
      {
        title: "Learn about AI Engineering",
        slug: "learn-about-ai-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRKZu7O57yMzWQwvhWjzmdwe516giQrMCkf2vyQ0GNyP-INRR0XViFC5NzI1WSFs7N7tdTyrK5NdPAf/pub",
        order: 5,
      },
      {
        title: "Learn about AR/VR Engineering",
        slug: "learn-about-ar-vr-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vS8em-Yoj-i5gyunfpUJDzeJTzVEkqEi07m8a61sS1Xlb-oEo6TT8apDGBxqCtQ2xj1FlgNCQiVvSOc/pub",
        order: 6,
      },
      {
        title: "Learn about Backend Engineering",
        slug: "learn-about-backend-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQbveG02wrx6yeX8hROPyudsjCac3oDB7U8lZ2TOpDTVv2SZYG28Z0lf_qy4pinmCK-Sg9-VW9N8VMP/pub",
        order: 7,
      },
      {
        title: "Learn about Blockchain Engineering",
        slug: "learn-about-blockchain-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRJkJKmxapmMtuKMjsucqetO2Ecm7w5zcmA78pO64AxKyrQneGPkcOVUY6IwT9EWc3KF9xaaA2gep4L/pub",
        order: 8,
      },
      {
        title: "Learn about Computer Vision Engineering",
        slug: "learn-about-computer-vision-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRJkJKmxapmMtuKMjsucqetO2Ecm7w5zcmA78pO64AxKyrQneGPkcOVUY6IwT9EWc3KF9xaaA2gep4L/pub",
        order: 9,
      },
      {
        title: "Learn about Cybersecurity Analysts/Specialists",
        slug: "learn-about-cybersecurity-analysts-specialists",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRpBhNpZTZiVqNTHtii1u-LDjUNPjmUTumn2w9oiKdNT7XBNWqtUYPg6f0_CQSdxHboWo-UvZf_f3GH/pub",
        order: 10,
      },
      {
        title: "Learn about Cybersecurity Engineering",
        slug: "learn-about-cybersecurity-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRI5zRpqj_005yzsZsVVuoLDGwDDU1b8K_Lfwa7bxeE2WAiteLFGk4LTqQWlVfJr5qks8HgURKvjjgj/pub",
        order: 11,
      },
      {
        title: "Learn about Data Engineering",
        slug: "learn-about-data-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQtoxHlSapvXGY3hBZv6UoyY-bWd4gmGJQS_djPslpP-j_Kk8-9zhgOj_T2cwnxGdTLYO4sVshD6uee/pub",
        order: 12,
      },
      {
        title: "Learn about Data Science",
        slug: "learn-about-data-science",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTZ0hDa0D8MHAVoiHYp7xXL_oMAmekCi8e5IquaGtIRthif-vx1l-u5IyGtRcGUYwp5NFz9T4C_A4c-/pub",
        order: 13,
      },
      {
        title: "Learn about DevOps Engineering",
        slug: "learn-about-devops-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRCAxnq_aX5ers_d_zsT9z-Sev9PJU1yv-Jyh8X04NmmJSPJY7dHyXkJ-IbtpiQghHS7vJPFUhWuW7k/pub",
        order: 14,
      },
      {
        title: "Learn about Embedded Engineering",
        slug: "learn-about-embedded-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSbsDKQT3WS4yGWvpnSEMggjX-DTXXgLI6iMcWl0gFo2BAFhf-zMI1hEK2otBQVT7nZUkP4AvAiVBAA/pub",
        order: 15,
      },
      {
        title: "Learn about Forward Deployed Engineering (FDE)",
        slug: "learn-about-forward-deployed-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRbTOM4TolS7mTbfLadQ3kG-XfBuE2FlVmaXmhyMzlbhyOg0SHQAu4IfYgr1bPEvz3kob4ko_aFci7c/pub",
        order: 16,
      },
      {
        title: "Learn about Frontend Engineering",
        slug: "learn-about-frontend-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQZPN4E6ukeE0AekakP8FRw6CXLFmSwdW_WvDv9g8U1CHd9eKW3_rh4IcZgdARGRgNMNslRA3ot8a3O/pub",
        order: 17,
      },
      {
        title: "Learn about Full-Stack Engineering",
        slug: "learn-about-full-stack-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQtLYIE8U82jnwigdmGb3jQ89GNICbRt_34V6AbOlO6elOdFdaRJ-H58Wzxru2yfl1taptliQcrTCPH/pub",
        order: 18,
      },
      {
        title: "Learn about Game Development",
        slug: "learn-about-game-development",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQu_n0i1JYluGR2BrxZIf2ZiG7eUt12z5ggIJnqTcoNCpr4pIRbZaMBuWdMi0epjtjel2MXa0vlwizH/pub",
        order: 19,
      },
      {
        title: "Learn about Machine Learning (ML) Engineering",
        slug: "learn-about-machine-learning-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQe-VGASzjwBE5VmiVgiVZW5mK9f02LAg1pxXJ5aK11t5e5HrAGzLU5WiBIbydi-saT4XG9C8CrUq9y/pub",
        order: 20,
      },
      {
        title: "Learn about Mobile App Engineering",
        slug: "learn-about-mobile-app-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTVW1iHkr_KgEmhhtKKjtALsxAdfTqifYcNsgrMIN4psYfAL6TwIhVUClxN7x5W_7_-CumG9YYU3sV6/pub",
        order: 21,
      },
      {
        title: "Learn about Product Management",
        slug: "learn-about-product-management",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQVwJsU2OO5AvoQi6T5TCeK9oE0YwqeJejscvjS9SRyg6a8mv8o16lqyBq3EVn-2L71dRyoWOLOMYQY/pub",
        order: 22,
      },
      {
        title: "Learn about Quant Developers",
        slug: "learn-about-quant-developers",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTWHuJuVmoshQ28NDzTi4TW_E05fMkj-H9Xux407Otb7F5H5f8J1d5xGXOn_wlDhbstdndPnQ6WF_9g/pub",
        order: 23,
      },
      {
        title: "Learn about Quant Traders",
        slug: "learn-about-quant-traders",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vR_CYlUx7K5F3P4u8ZAg13oCsF7Hq2_UkOF86Z-jWJs1tkYqSu1sxa3erLuZ85EMTSO1GFld63H9sHZ/pub",
        order: 24,
      },
      {
        title: "Learn about Site Reliability Engineering (SRE)",
        slug: "learn-about-site-reliability-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTikNi02Bs31KfMyJHp_LlBUj17Xdp2zxdTqUhabexisieC3QoIx6PTGT387YYMapGxdekuKwimkvVN/pub",
        order: 25,
      },
      {
        title: "Learn about UI/UX Design",
        slug: "learn-about-ui-ux-design",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSY06-JiOP7ZnglPab9VXEkroPV5CCM4c2TxTOodBjCY0UCVjyvHPqpwuEO8B6zp1zdcWXRVcCVMFbW/pub",
        order: 26,
      },
      {
        title: "Learn about Web Development",
        slug: "learn-about-web-development",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTu7t6WCqOiYkKuSCVkS08jMIZMFC2eTcOyRglFB68a7TliVdSpdkTa5XviHDC95dH-McYYrMMyb8XO/pub",
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
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSLjMsCe_rHTBF0-0OzN63PDAqCdTZdcfkJuMKNx9yAOYG7Bi3EzQyALvABGR5-jhJ4DWsS9Q6c0pHf/pub",
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
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSawJgeiv6A61X3bhi0jXNyT7SCQu8lcmyzPkUEBITsLuBRvCSiJi_G38IqV9IEbyYfhLsMZ5GzDLxh/pub",
        order: 1,
      },
      {
        title: "Informational Interviewing & Networking Tipsheet for Tech",
        slug: "informational-interviewing-networking-tipsheet",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSfwnZ_Rn8fAGZCsj32zpgpSPE8rZhAT9rykW3P47JFJerLYAj7-3C42HlWIyXKihU0U452dnECNjli/pub",
        order: 2,
      },
      {
        title: "Is Networking Worth It For Tech Jobs?",
        slug: "is-networking-worth-it",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTi4U8Y-4_SYPnmEnldYQYlX6z-PDUPALv9WFhgcLpyU6KEvZhMvMGCKGyCRyIwk9YMztKRbhvM7PIN/pub",
        order: 3,
      },
      {
        title: "How to Network With Tech Recruiters",
        slug: "how-to-network-with-tech-recruiters",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQ1QziBf6dnWedDj2k5Ccn004pXR72vgflfI1_UMQXSezMqfg_M7yo2-aTRjLwsiLXvBXlMcCZ6KrJs/pub",
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
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSVZ_iz5X0GImwMGT8Bb-Pknkgu2IaQlCmxpwjtueVb41WeQmMYTduVkTqNxWHYzhsEuQ4NCLPsq6J6/pub",
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
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTZXQBPmcggS73TB2Lq25CzQNtudSSVbf_QUXQ-qey4wgeH6E0yNRSszX3eoN1oUmAcdlebvhAqOGZX/pub",
        order: 1,
      },
      {
        title: "Tech Resume Example with Annotations",
        slug: "tech-resume-example",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSjS8d_YwKSSR9h_S1DyVoyZZh1wZr8z5qoqnY7vazFiJhzv2VUGx0toRq9d0D4cs549ODZEGSzyF2V/pub",
        order: 2,
      },
      {
        title: "Examples: Quantify Impact on Tech Resumes",
        slug: "quantify-impact-on-resumes",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTMR3s9-hQ6kCN90EcihRZxOY4yCHF2PZ32zYeF298fW-ZCH2ai7P7vcAdg0UVJny7-2VaTxkuuCbAN/pub",
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
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRlHF760Z0aFKeuMy9APJ7Ol7R6YZNdEUXKx3j2zkv-Jy2dQcuC4lcm5jZQWYtyomi1oftl6-x_Udaa/pub",
        order: 1,
      },
      {
        title: "Ace the Tech Interview: Solve Coding Challenges with Confidence",
        slug: "ace-interview-coding-challenges",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTYFiUSOjMNcdVvFRmLVxO9mLJHF6yhGz6-HFWXBzk3DlcyJs463TkluxVWGNxaQy5JN867WVkef3Rs/pub",
        order: 2,
      },
      {
        title: "Ace the Tech Interview: Stand Out with Smart Questions",
        slug: "ace-interview-smart-questions",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vR5NMtYIXNa7JW4Ry3ZfPVuX7mXtWvjlz8iV9qLMQt0b_8V9xpPw_LSPmRDueggs45tqhtS85OZp1g1/pub",
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
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTRqD4NtZz9jN1DMh3CFKTjSiTTmzA-e6xqdMKZ6spU92HVwotkvxS7qzqFHX5p4PLdzLF0msxvLoIS/pub",
        order: 1,
      },
      {
        title: "Tech Job Offer Evaluation and Negotiation Checklist",
        slug: "offer-evaluation-negotiation-checklist",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSXHrCS5VDZHh-mtmwnDmlYTEH70a3EURfwpNqGWRC3thQyAGeMaOhNHZQfhA2SGlRaB7-mLUGcIeFo/pub",
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
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTjeH9HXDbHD4KQW9IjDyDJRkrJU3VtpPoOjvgG-anO2WBN_JrzqC9oFurWBQLSC6KVuGm_UVJS6jPu/pub",
        order: 1,
      },
      {
        title: "Tech Internship Success Checklist",
        slug: "internship-success-checklist",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRGkIYEJg36u-ylV_m4nGa2WZk0bJXlntB8ivrSHq7KDywxyBIgX9ue06AOKPRm1vZtsVzArsFr0M6A/pub",
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
