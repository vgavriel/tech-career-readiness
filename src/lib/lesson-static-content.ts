/**
 * Static lesson content payload used for locally stored lessons.
 */
export type StaticLessonContent = {
  slug: string;
  estimatedMinutes: number;
  contentHtml: string;
};

const startToFinishContent = [
  "<p>Welcome to the roadmap. This lesson is the quick map of what you will learn in this app and how the pieces fit together for Brown students.</p>",
  "<p>Most students move through the core lessons in 6 weeks to 6 months depending on their timeline. Every core lesson counts toward completion; extra credit lessons are optional and do not block your progress.</p>",
  "<h2>How to use this course</h2>",
  "<ul>",
  "<li>Pick a focus if you are on a deadline. It selects a subset of the curriculum to match your timeline.</li>",
  "<li>Lessons are marked complete as you move through the course. We will always point you to the next core lesson.</li>",
  "<li>Come back anytime. Your progress is saved locally or to your account if you sign in.</li>",
  "</ul>",
  "<h2>Course Modules</h2>",
  "<ol>",
  "<li><strong>Start here</strong></a> - the roadmap (this lesson) plus the Tech Recruiting Timeline.</li>",
  '<li><a href="/lesson/explore-technology-jobs"><strong>Explore roles</strong></a> - understand tech roles and how Brown CS prepare you for certain job titles.</li>',
  '<li><a href="/lesson/build-experience"><strong>Build experience</strong></a> - plan projects, coursework, and on-campus opportunities to build experience outside of internships.</li>',
  '<li><a href="/lesson/tech-internship-and-job-boards"><strong>Find opportunities + networking</strong></a> - job boards, informational interviews, and recruiter outreach.</li>',
  '<li><a href="/lesson/research-tech-companies-core-values"><strong>Research companies</strong></a> - values, teams, and role fit so you can tailor applications.</li>',
  '<li><a href="/lesson/craft-winning-tech-applications"><strong>Applications</strong></a> - create outstanding application materials.</li>',
  '<li><a href="/lesson/ace-interview-prep-timeline"><strong>Interviews</strong></a> - prep timeline, navigating coding challenges, and asking smart questions.</li>',
  '<li><a href="/lesson/offer-evaluation-negotiation"><strong>Offers</strong></a> - evaluate and negotiate with confidence.</li>',
  "</ol>",
  "<h2>Extra credit and role deep dives</h2>",
  "<p>Optional lessons help you explore specific roles or prepare for internship success after you have an offer.</p>",
  "<ul>",
  '<li><a href="/roles"><strong>Role Library</strong></a> deep dives (AI, data, product, security, and more).</li>',
  '<li><a href="/lesson/tech-career-stories"><strong>Tech Career Stories</strong></a> from Brown-specific journeys.</li>',
  '<li><a href="/lesson/internship-success-handbook"><strong>Internship success</strong></a> handbook + checklist.</li>',
  "</ul>",
  "<h2>Pick a focus if you are on a timeline</h2>",
  "<ul>",
  "<li><strong>Just starting / exploring</strong></a></li>",
  "<li><strong>Applying soon (1-2 weeks)</strong></a></li>",
  "<li><strong>Interviewing soon</strong></a></li>",
  "<li><strong>Offer in hand / internship prep</strong></a></li>",
  "</ul>",
  "<h2>What you will have by the end</h2>",
  "<p>Clear role targets, a resume that shows impact, a repeatable networking plan, and a prep routine for interviews and offers.</p>",
  "<p>When you are ready, continue to the Tech Recruiting Timeline to see how the steps fit across the year.</p>",
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

/**
 * Look up static lesson content by slug.
 */
export const getStaticLessonContent = (slug: string) => staticLessonContent.get(slug) ?? null;
