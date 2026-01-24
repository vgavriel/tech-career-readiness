export type StaticLessonContent = {
  slug: string;
  estimatedMinutes: number;
  contentHtml: string;
};

const startToFinishContent = [
  "<p>Landing a job or internship in tech can feel like navigating a maze. With so many stages and expectations, it is easy to get overwhelmed, especially if you are just starting out.</p>",
  "<p>This course is designed to help you confidently approach the entire process: from understanding what roles are out there to crafting standout applications, acing interviews, and evaluating offers.</p>",
  "<p>Most students move through the core lessons in 6 weeks to 6 months depending on their timeline. The guidance is tailored to Brown students and uses Brown-specific context throughout.</p>",
  "<h2>1. Exploring Tech Careers: What Roles Are Out There?</h2>",
  "<p>Before diving into applications, it is helpful to understand the landscape of tech careers. The industry is vast, with roles ranging from software development to product management, cybersecurity, and beyond. This section helps you explore roles and how your skills and interests align.</p>",
  "<p>You will also see how Brown coursework connects to common job titles, and how job titles map back to courses you might choose next.</p>",
  "<h2>2. Finding Tech Jobs: Job Boards and Networking</h2>",
  "<p>This section covers where tech internships and full-time roles are posted and how to stay organized.</p>",
  "<p>Networking unlocks opportunities. Warm referrals lead to interviews, and new connections lead to roles that are not publicly posted. You will learn how to build connections with classmates, alumni, and teams, and why referrals help your application stand out.</p>",
  "<h2>3. A Bit of Homework: Researching the Company</h2>",
  "<p>Before applying, it helps to understand a company's mission, values, and role specifics. This section shows how to tailor your application and prepare for interviews by studying the company and team.</p>",
  "<h2>4. Crafting Your Application</h2>",
  "<p>Your application is your first impression. This section focuses on building a resume, cover letter, and project portfolio that highlight impact, not just activities. You will learn how to tailor materials for each role and communicate results clearly.</p>",
  "<h2>5. Practicing Coding Challenges and Doing Mock Interviews</h2>",
  "<p>Preparation builds confidence. You will develop a steady practice plan for coding challenges and mock interviews, with realistic timing and expectations for different roles.</p>",
  "<h2>6. Navigating Interviews: From Recruiter Screening to Technical Rounds</h2>",
  "<p>Interviews come in stages. This section covers recruiter screens, hiring manager conversations, technical interviews, and behavioral rounds. You will learn how to tell concise project stories and communicate your value clearly.</p>",
  "<h2>7. Evaluating and Negotiating Your Offer</h2>",
  "<p>Once you receive an offer, you will learn how to evaluate total compensation, growth potential, and role fit. You will also learn how to negotiate with confidence and professionalism.</p>",
  "<h2>Conclusion: Your Path to Success</h2>",
  "<p>The tech recruiting process is challenging, but with the right preparation you can navigate it successfully. Use this course to turn uncertainty into a plan and build momentum week by week.</p>",
].join("");

const staticLessonContent = new Map<string, StaticLessonContent>([
  [
    "start-to-finish-roadmap",
    {
      slug: "start-to-finish-roadmap",
      estimatedMinutes: 3,
      contentHtml: startToFinishContent,
    },
  ],
]);

export const getStaticLessonContent = (slug: string) =>
  staticLessonContent.get(slug) ?? null;
