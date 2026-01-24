const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const {
  resolveExistingRecord,
  getLessonSlug,
  collectLessonSlugs,
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
    title: "Start Here",
    order: 1,
    description: "Begin with the Brown-specific roadmap and recruiting timeline.",
    lessons: [
      {
        title: "Start to Finish: The Roadmap to a Tech Internship or Job",
        slug: "start-to-finish-roadmap",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRWVi28NTFDO-AAERit3UOTaYX7YfBnpCv-tsJVOEOp5fzhrliW1GzLuMz8FDCm1qrn6YkRHVy4uGLX/pub",
        googleDocId: "1KdbDPRxkfoYp5czGyGQQs1gM_XH_NiE1I60HghaND24",
        order: 1,
        estimatedMinutes: 3,
      },
      {
        title: "Tech Recruiting Timeline",
        slug: "tech-recruiting-timeline",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTHH1jcNhUKgeV4KLJ7cwzzD3ayIjdp8gD_7KK5DPLRJ6uJIEgONJSiTbBh3zzlFvC_7HPIhW9tOGnE/pub",
        googleDocId: "1imMo-eNqgSfr4GJjEtXk5q0wrpPJaxj2qS1Aw2VDggk",
        order: 2,
        estimatedMinutes: 8,
      },
      {
        title:
          "3 Short Stories to Illustrate the Tech Career Exploration Journey at Brown University",
        slug: "tech-career-stories",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTyuE0viX0FlrN-9-sBWRLXlQ8L_igcRe6Kp3K9HuXCRkPmcQPQzkZUvQ_OuuaXh3UV17cXegspmMBZ/pub",
        googleDocId: "1IAxwahdRvhScFrEEo3Elxtj3WZ4cqr0dRUyQ2SYVEQQ",
        order: 3,
        estimatedMinutes: 7,
      },
    ],
  },
  {
    key: "explore-roles",
    title: "Explore Roles",
    order: 2,
    description:
      "Survey tech roles, course maps, and Brown-specific role deep dives.",
    lessons: [
      {
        title: "Explore Various Technology Jobs and Fields",
        slug: "explore-technology-jobs",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRuv0GCUAiihHrN8KmMlvT9UcdGEDrivlOfmEBo1gRDFT_m0hfK43zXE1ZUgnOSqYG1YVATyBwYuvoz/pub",
        googleDocId: "1Ipwj5X6x6JFt866_P3MCTP-mY3V5sj7VVsjnRXFIoNI",
        order: 1,
        estimatedMinutes: 10,
      },
      {
        title: "Popular Tech Roles",
        slug: "popular-tech-roles",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSf74z7c8Eqi2jlFamzSaQOOfUvPxTaFNiz7lugIsl8CyAGDHATfFr-y9nz3_j_B81EQYrWh-NfZ1Be/pub",
        googleDocId: "1XWEprd-WUIQcex7GRH4S_AVt94_yne8qPdE9aP0wGLE",
        order: 2,
        estimatedMinutes: 8,
      },
      {
        title: "Map of CS Courses to Job Titles",
        slug: "cs-courses-to-job-titles",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQRiteLjqeiGRO_rYcW73NkV9zUH5-9lATBWnZj4eG9UecnBAzjTZHvF2QrgeDHCqnlnoqLOju9g3_r/pub",
        googleDocId: "1W65ERRUfGGaJAZbUyKO2hBYkr4xaPxKS44lmfTd7CFE",
        order: 3,
        estimatedMinutes: 10,
      },
      {
        title: "Map of Job Titles to CS Courses",
        slug: "job-titles-to-cs-courses",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTezgLn6qALqRCjVz28Ii71wkNe7AqqQPdJJkthbb_nphfdXK9IMX_6MAwbMmoBGMaNfDYq0ZRVm-GQ/pub",
        googleDocId: "1GKzBqdyOhqqsFARbmzUoNXS9WcCiayz0xmJ21zHZ2z4",
        order: 4,
        estimatedMinutes: 10,
      },
      {
        title: "Learn about AI Engineering",
        slug: "learn-about-ai-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRKZu7O57yMzWQwvhWjzmdwe516giQrMCkf2vyQ0GNyP-INRR0XViFC5NzI1WSFs7N7tdTyrK5NdPAf/pub",
        googleDocId: "11hRL7OwV5G5rUQPQ8KWWivJK8FXZooseX-us2dhAhmo",
        order: 5,
        estimatedMinutes: 8,
      },
      {
        title: "Learn about AR/VR Engineering",
        slug: "learn-about-ar-vr-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vS8em-Yoj-i5gyunfpUJDzeJTzVEkqEi07m8a61sS1Xlb-oEo6TT8apDGBxqCtQ2xj1FlgNCQiVvSOc/pub",
        googleDocId: "1T_Yv7swaj6xPaXKjNtKVEc29bLAGfsFChTx7tQ0VlFA",
        order: 6,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Backend Engineering",
        slug: "learn-about-backend-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQbveG02wrx6yeX8hROPyudsjCac3oDB7U8lZ2TOpDTVv2SZYG28Z0lf_qy4pinmCK-Sg9-VW9N8VMP/pub",
        googleDocId: "1zTZ3JdQb3aQU-Uz_9hHfbLkAtLamLrI1FC1YKPR2yfc",
        order: 7,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Blockchain Engineering",
        slug: "learn-about-blockchain-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRJkJKmxapmMtuKMjsucqetO2Ecm7w5zcmA78pO64AxKyrQneGPkcOVUY6IwT9EWc3KF9xaaA2gep4L/pub",
        googleDocId: "1m6Y1_5OVU_7BwobqpyGkgVU56GZnZM6A_qBgINEdttw",
        order: 8,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Computer Vision Engineering",
        slug: "learn-about-computer-vision-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTcAFO4BF0pYKT4NRm4zdbYXv1jTRZOoggAvaTUMemAxNDXHtj-jhqWsr4WA6Zwo6f-Zr01C9vPTEAa/pub",
        googleDocId: "1bpgYA_GITo7KIMbj52Q8MaiKu-x2xKCUg1wNtpXs7TA",
        order: 9,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Cybersecurity Analysts/Specialists",
        slug: "learn-about-cybersecurity-analysts-specialists",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRpBhNpZTZiVqNTHtii1u-LDjUNPjmUTumn2w9oiKdNT7XBNWqtUYPg6f0_CQSdxHboWo-UvZf_f3GH/pub",
        googleDocId: "1WbRRhu2YrQykrPNwEO2G70IKiSPnTdTorhkHt0yZOQw",
        order: 10,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Cybersecurity Engineering",
        slug: "learn-about-cybersecurity-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRI5zRpqj_005yzsZsVVuoLDGwDDU1b8K_Lfwa7bxeE2WAiteLFGk4LTqQWlVfJr5qks8HgURKvjjgj/pub",
        googleDocId: "1HX2Dg8TCOMLg8fL2L4uqlusWo65baba3gTYht_Gxv9E",
        order: 11,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Data Engineering",
        slug: "learn-about-data-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQtoxHlSapvXGY3hBZv6UoyY-bWd4gmGJQS_djPslpP-j_Kk8-9zhgOj_T2cwnxGdTLYO4sVshD6uee/pub",
        googleDocId: "1aIuvzuQr9o3aBuuOz4MkcUrIja8ejxPCXEsjXYxpn8I",
        order: 12,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Data Science",
        slug: "learn-about-data-science",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTZ0hDa0D8MHAVoiHYp7xXL_oMAmekCi8e5IquaGtIRthif-vx1l-u5IyGtRcGUYwp5NFz9T4C_A4c-/pub",
        googleDocId: "1isdV2culbHq3Jr0Yz0aKav3k41c5yjjNBZcbA0p20PM",
        order: 13,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about DevOps Engineering",
        slug: "learn-about-devops-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRCAxnq_aX5ers_d_zsT9z-Sev9PJU1yv-Jyh8X04NmmJSPJY7dHyXkJ-IbtpiQghHS7vJPFUhWuW7k/pub",
        googleDocId: "1HE4LyuQNNAHj0jTyknxVY45EEYRP95YKcNp7KCxZkfM",
        order: 14,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Embedded Engineering",
        slug: "learn-about-embedded-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSbsDKQT3WS4yGWvpnSEMggjX-DTXXgLI6iMcWl0gFo2BAFhf-zMI1hEK2otBQVT7nZUkP4AvAiVBAA/pub",
        googleDocId: "1ipol5wRDzCB_Q708DXoTxJ9BLauuWTK3mU8CTQn0tvw",
        order: 15,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Forward Deployed Engineering (FDE)",
        slug: "learn-about-forward-deployed-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRbTOM4TolS7mTbfLadQ3kG-XfBuE2FlVmaXmhyMzlbhyOg0SHQAu4IfYgr1bPEvz3kob4ko_aFci7c/pub",
        googleDocId: "1ub55tzF1jR0gwNZc85hOyYny_9-MNIm_K2IJCQfcqyQ",
        order: 16,
        estimatedMinutes: 6,
      },
      {
        title: "Learn about Frontend Engineering",
        slug: "learn-about-frontend-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQZPN4E6ukeE0AekakP8FRw6CXLFmSwdW_WvDv9g8U1CHd9eKW3_rh4IcZgdARGRgNMNslRA3ot8a3O/pub",
        googleDocId: "1iIxhTMlwi2BbY3gWqx7DqQ4t7EV46W1jcEN9FFMf8dY",
        order: 17,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Full-Stack Engineering",
        slug: "learn-about-full-stack-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQtLYIE8U82jnwigdmGb3jQ89GNICbRt_34V6AbOlO6elOdFdaRJ-H58Wzxru2yfl1taptliQcrTCPH/pub",
        googleDocId: "1jTlpdpwx9GCLtPNl5gougnpnKRgvUKcmpPJHbpKZkF4",
        order: 18,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Game Development",
        slug: "learn-about-game-development",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQu_n0i1JYluGR2BrxZIf2ZiG7eUt12z5ggIJnqTcoNCpr4pIRbZaMBuWdMi0epjtjel2MXa0vlwizH/pub",
        googleDocId: "1z8oarTWpwSvbrTjuj67nPEENcmSJclwAo8gkxba7tlg",
        order: 19,
        estimatedMinutes: 6,
      },
      {
        title: "Learn about Machine Learning (ML) Engineering",
        slug: "learn-about-machine-learning-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQe-VGASzjwBE5VmiVgiVZW5mK9f02LAg1pxXJ5aK11t5e5HrAGzLU5WiBIbydi-saT4XG9C8CrUq9y/pub",
        googleDocId: "14_utok--ksibF_knCO9n2LveE_ixBj93o4x9IX21MyE",
        order: 20,
        estimatedMinutes: 8,
      },
      {
        title: "Learn about Mobile App Engineering",
        slug: "learn-about-mobile-app-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTVW1iHkr_KgEmhhtKKjtALsxAdfTqifYcNsgrMIN4psYfAL6TwIhVUClxN7x5W_7_-CumG9YYU3sV6/pub",
        googleDocId: "1-gRoYkhg8KWI_E-IujY0knoNwhKgzgkGJIGgQ_Y-YAA",
        order: 21,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Product Management",
        slug: "learn-about-product-management",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQVwJsU2OO5AvoQi6T5TCeK9oE0YwqeJejscvjS9SRyg6a8mv8o16lqyBq3EVn-2L71dRyoWOLOMYQY/pub",
        googleDocId: "1cYMM_HZJp8kQNnA4mgVvf4XtxksBum7ZDcsKakhnJv0",
        order: 22,
        estimatedMinutes: 8,
      },
      {
        title: "Learn about Quant Developers",
        slug: "learn-about-quant-developers",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTWHuJuVmoshQ28NDzTi4TW_E05fMkj-H9Xux407Otb7F5H5f8J1d5xGXOn_wlDhbstdndPnQ6WF_9g/pub",
        googleDocId: "1xca7j_DnSTJ7_YBSWLE4Xr2VNQUFoqMhYdvZPHKA0RM",
        order: 23,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Quant Traders",
        slug: "learn-about-quant-traders",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vR_CYlUx7K5F3P4u8ZAg13oCsF7Hq2_UkOF86Z-jWJs1tkYqSu1sxa3erLuZ85EMTSO1GFld63H9sHZ/pub",
        googleDocId: "1HdIgsbINiBkb0isMkfvyaZ1KAY5bvCu0XQdvDBbMmXw",
        order: 24,
        estimatedMinutes: 6,
      },
      {
        title: "Learn about Site Reliability Engineering (SRE)",
        slug: "learn-about-site-reliability-engineering",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTikNi02Bs31KfMyJHp_LlBUj17Xdp2zxdTqUhabexisieC3QoIx6PTGT387YYMapGxdekuKwimkvVN/pub",
        googleDocId: "15NQ508oI8DyM9hRMkHNP4I_RZ61z6tqapOhasARK7Bs",
        order: 25,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about UI/UX Design",
        slug: "learn-about-ui-ux-design",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSY06-JiOP7ZnglPab9VXEkroPV5CCM4c2TxTOodBjCY0UCVjyvHPqpwuEO8B6zp1zdcWXRVcCVMFbW/pub",
        googleDocId: "1AJ9S_6ZWR2tuwrt6ninlK_zbrV_s6cgZgPOgBRsC1xY",
        order: 26,
        estimatedMinutes: 7,
      },
      {
        title: "Learn about Web Development",
        slug: "learn-about-web-development",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTu7t6WCqOiYkKuSCVkS08jMIZMFC2eTcOyRglFB68a7TliVdSpdkTa5XviHDC95dH-McYYrMMyb8XO/pub",
        googleDocId: "1i6NPDVRstDbNyCbcldnsJMrVUzlOCfzvpzx_HE_PJJM",
        order: 27,
        estimatedMinutes: 7,
      },
    ],
  },
  {
    key: "build-experience",
    title: "Build Experience",
    order: 3,
    description:
      "Build the projects, skills, and exposure that hiring teams expect.",
    lessons: [
      {
        title: "Build Experience to Get Tech Internships and New-Grad Jobs",
        slug: "build-experience",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSLjMsCe_rHTBF0-0OzN63PDAqCdTZdcfkJuMKNx9yAOYG7Bi3EzQyALvABGR5-jhJ4DWsS9Q6c0pHf/pub",
        googleDocId: "1AexHrN5_BBF2yBJ9MWShDiBu7pYvZ6C9Jb8j1JXCGn4",
        order: 1,
        estimatedMinutes: 12,
      },
    ],
  },
  {
    key: "opportunities-networking",
    title: "Find Opportunities & Network",
    order: 4,
    description: "Use job boards, outreach, and referrals to get interviews.",
    lessons: [
      {
        title: "Tech Internship and Job Boards",
        slug: "tech-internship-and-job-boards",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSawJgeiv6A61X3bhi0jXNyT7SCQu8lcmyzPkUEBITsLuBRvCSiJi_G38IqV9IEbyYfhLsMZ5GzDLxh/pub",
        googleDocId: "1p4JWk1K5a5rhp0meSYWYbhI1dYGYQVcRRaYtgVg1ni8",
        order: 1,
        estimatedMinutes: 8,
      },
      {
        title: "Informational Interviewing & Networking Tipsheet for Tech",
        slug: "informational-interviewing-networking-tipsheet",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSfwnZ_Rn8fAGZCsj32zpgpSPE8rZhAT9rykW3P47JFJerLYAj7-3C42HlWIyXKihU0U452dnECNjli/pub",
        googleDocId: "1vkIjGk5L-4qouNtFsuya3IpywiWqzfPWu1UVqR30sEo",
        order: 2,
        estimatedMinutes: 9,
      },
      {
        title: "Is Networking Worth It For Tech Jobs?",
        slug: "is-networking-worth-it",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTi4U8Y-4_SYPnmEnldYQYlX6z-PDUPALv9WFhgcLpyU6KEvZhMvMGCKGyCRyIwk9YMztKRbhvM7PIN/pub",
        googleDocId: "1RGGBwLmsgzU4r1tsjZTPDcxsiOzez5hvG8SAJIRgAtI",
        order: 3,
        estimatedMinutes: 6,
      },
      {
        title: "How to Network With Tech Recruiters",
        slug: "how-to-network-with-tech-recruiters",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vQ1QziBf6dnWedDj2k5Ccn004pXR72vgflfI1_UMQXSezMqfg_M7yo2-aTRjLwsiLXvBXlMcCZ6KrJs/pub",
        googleDocId: "1qxtNFR2PZxv7yFgOFqTU3uRBZDA3EuijgaNLtRz8HDk",
        order: 4,
        estimatedMinutes: 7,
      },
    ],
  },
  {
    key: "research-companies",
    title: "Research Companies",
    order: 5,
    description: "Align your applications with company values and roles.",
    lessons: [
      {
        title: "Researching Tech Companies and Understanding Core Values",
        slug: "research-tech-companies-core-values",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSVZ_iz5X0GImwMGT8Bb-Pknkgu2IaQlCmxpwjtueVb41WeQmMYTduVkTqNxWHYzhsEuQ4NCLPsq6J6/pub",
        googleDocId: "1cJYFdI2zNFpxr3JmVkc7pskbhyjo_3X0cptHZ2lYPvo",
        order: 1,
        estimatedMinutes: 9,
      },
    ],
  },
  {
    key: "applications",
    title: "Applications",
    order: 6,
    description: "Craft resumes and submissions that stand out quickly.",
    lessons: [
      {
        title: "Craft Winning Tech Job and Internship Applications",
        slug: "craft-winning-tech-applications",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTZXQBPmcggS73TB2Lq25CzQNtudSSVbf_QUXQ-qey4wgeH6E0yNRSszX3eoN1oUmAcdlebvhAqOGZX/pub",
        googleDocId: "1auSKoRLFXNxwE-dLhSI8xa_kEi5WfXJNeDX_TfoqaAs",
        order: 1,
        estimatedMinutes: 12,
      },
      {
        title: "Tech Resume Example with Annotations",
        slug: "tech-resume-example",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSjS8d_YwKSSR9h_S1DyVoyZZh1wZr8z5qoqnY7vazFiJhzv2VUGx0toRq9d0D4cs549ODZEGSzyF2V/pub",
        googleDocId: "1eP7sJtgJxT0i9vR7bsSfQY3wFb7_5ewCOcscenBLkyQ",
        order: 2,
        estimatedMinutes: 8,
      },
      {
        title: "Examples: Quantify Impact on Tech Resumes",
        slug: "quantify-impact-on-resumes",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTMR3s9-hQ6kCN90EcihRZxOY4yCHF2PZ32zYeF298fW-ZCH2ai7P7vcAdg0UVJny7-2VaTxkuuCbAN/pub",
        googleDocId: "1TvWLGoEdPwNB3g1dcxA605TLGosdfF3B6-eOV0o0KAQ",
        order: 3,
        estimatedMinutes: 7,
      },
    ],
  },
  {
    key: "interviews",
    title: "Interviews",
    order: 7,
    description: "Prepare for technical, behavioral, and strategic interviews.",
    lessons: [
      {
        title: "Ace the Tech Interview: Your Ultimate Prep Timeline",
        slug: "ace-interview-prep-timeline",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRlHF760Z0aFKeuMy9APJ7Ol7R6YZNdEUXKx3j2zkv-Jy2dQcuC4lcm5jZQWYtyomi1oftl6-x_Udaa/pub",
        googleDocId: "1HQL1nG_kiF4kCCTf2bWy4xydFv0htBJniYWG8U7tfRk",
        order: 1,
        estimatedMinutes: 12,
      },
      {
        title: "Ace the Tech Interview: Solve Coding Challenges with Confidence",
        slug: "ace-interview-coding-challenges",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTYFiUSOjMNcdVvFRmLVxO9mLJHF6yhGz6-HFWXBzk3DlcyJs463TkluxVWGNxaQy5JN867WVkef3Rs/pub",
        googleDocId: "1p72xOQqc0WpK60Z3V4fpwp8-g8EJAkZLJWXm3z1wuQU",
        order: 2,
        estimatedMinutes: 14,
      },
      {
        title: "Ace the Tech Interview: Stand Out with Smart Questions",
        slug: "ace-interview-smart-questions",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vR5NMtYIXNa7JW4Ry3ZfPVuX7mXtWvjlz8iV9qLMQt0b_8V9xpPw_LSPmRDueggs45tqhtS85OZp1g1/pub",
        googleDocId: "1lj0CMIx7KU1snqpIoPF8U8R9_ozh_yIOWTNoTZa-J_U",
        order: 3,
        estimatedMinutes: 8,
      },
    ],
  },
  {
    key: "offers",
    title: "Offers",
    order: 8,
    description: "Evaluate and negotiate offers with confidence.",
    lessons: [
      {
        title: "Tech Job Offer Evaluation and Negotiation",
        slug: "offer-evaluation-negotiation",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTRqD4NtZz9jN1DMh3CFKTjSiTTmzA-e6xqdMKZ6spU92HVwotkvxS7qzqFHX5p4PLdzLF0msxvLoIS/pub",
        googleDocId: "1J6yjm2Ztio8jBSDMxacOVyleuJC3Z3WQ07vh5UrFVkw",
        order: 1,
        estimatedMinutes: 10,
      },
      {
        title: "Tech Job Offer Evaluation and Negotiation Checklist",
        slug: "offer-evaluation-negotiation-checklist",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vSXHrCS5VDZHh-mtmwnDmlYTEH70a3EURfwpNqGWRC3thQyAGeMaOhNHZQfhA2SGlRaB7-mLUGcIeFo/pub",
        googleDocId: "15FtDBxDIZ7SIXfewvuo18dOC7cOUioz0ygJueaeA_ro",
        order: 2,
        estimatedMinutes: 6,
      },
    ],
  },
  {
    key: "internship-success",
    title: "Internship Success",
    order: 9,
    description: "Make the most of your internship from day one.",
    lessons: [
      {
        title: "Tech Internship Success Handbook",
        slug: "internship-success-handbook",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vTjeH9HXDbHD4KQW9IjDyDJRkrJU3VtpPoOjvgG-anO2WBN_JrzqC9oFurWBQLSC6KVuGm_UVJS6jPu/pub",
        googleDocId: "1x1oQmqFnYYjEjbw_10zXeAcvS2NsRskwrAEkm3wLwg8",
        order: 1,
        estimatedMinutes: 12,
      },
      {
        title: "Tech Internship Success Checklist",
        slug: "internship-success-checklist",
        publishedUrl: "https://docs.google.com/document/d/e/2PACX-1vRGkIYEJg36u-ylV_m4nGa2WZk0bJXlntB8ivrSHq7KDywxyBIgX9ue06AOKPRm1vZtsVzArsFr0M6A/pub",
        googleDocId: "1j5ABO3agGdTcAuRwVK19F5Tv3xqtLfoflU-psPWqRHU",
        order: 2,
        estimatedMinutes: 6,
      },
    ],
  },
];

async function main() {
  for (const moduleData of modules) {
    const moduleRecord = await prisma.module.upsert({
      where: { key: moduleData.key },
      update: {
        title: moduleData.title,
        order: moduleData.order,
        description: moduleData.description,
      },
      create: {
        key: moduleData.key,
        title: moduleData.title,
        order: moduleData.order,
        description: moduleData.description,
      },
    });

    for (const lessonData of moduleData.lessons) {
      const lessonSlug = getLessonSlug(lessonData);
      const publishedUrl =
        lessonData.publishedUrl ??
        `https://docs.google.com/document/d/e/${lessonData.slug}/pub`;
      const googleDocId = Object.hasOwn(lessonData, "googleDocId")
        ? lessonData.googleDocId ?? null
        : undefined;

      const lessonBySlug = await prisma.lesson.findUnique({
        where: { slug: lessonSlug },
      });
      const lessonByOrder = await prisma.lesson.findFirst({
        where: { moduleId: moduleRecord.id, order: lessonData.order },
      });
      const { record: existingLesson } = resolveExistingRecord({
        recordBySlug: lessonBySlug,
        recordByOrder: lessonByOrder,
      });

      const previousSlug = existingLesson?.slug ?? null;

      const lessonRecord = existingLesson
        ? await prisma.lesson.update({
            where: { id: existingLesson.id },
            data: {
              title: lessonData.title,
              slug: lessonData.slug,
              order: lessonData.order,
              estimatedMinutes: lessonData.estimatedMinutes ?? null,
              moduleId: moduleRecord.id,
              publishedUrl,
              isArchived: false,
              ...(googleDocId !== undefined ? { googleDocId } : {}),
            },
          })
        : await prisma.lesson.create({
            data: {
              title: lessonData.title,
              slug: lessonData.slug,
              order: lessonData.order,
              estimatedMinutes: lessonData.estimatedMinutes ?? null,
              moduleId: moduleRecord.id,
              publishedUrl,
              isArchived: false,
              ...(googleDocId !== undefined ? { googleDocId } : {}),
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

    const lessonSlugs = collectLessonSlugs(moduleData.lessons);

    await prisma.lesson.updateMany({
      where: {
        moduleId: moduleRecord.id,
        slug: { notIn: lessonSlugs },
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
