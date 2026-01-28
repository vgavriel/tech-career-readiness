/**
 * Sample lesson content used for previews or mocks.
 */
export type LessonExample = {
  slug: string;
  title: string;
  summary: string;
  focus: string;
  deliverable: string;
  estimatedMinutes: number;
  outcomes: string[];
  checklist: string[];
  plan: Array<{ title: string; detail: string }>;
  contentHtml: string;
};

const startToFinishContent = [
  "<h2>Why this lesson matters</h2>",
  "<p>This roadmap shows the recruiting sequence end-to-end so you always know what to do next.</p>",
  "<h3>What you will cover</h3>",
  "<ul>",
  "<li>Explore roles and map courses to jobs.</li>",
  "<li>Build experience with projects and internships.</li>",
  "<li>Network, apply, and interview with structure.</li>",
  "<li>Evaluate offers and prepare for internships.</li>",
  "</ul>",
  "<h3>How to use the roadmap</h3>",
  "<ol>",
  "<li>Pick the focus that matches your urgency.</li>",
  "<li>Complete the next three lessons in order.</li>",
  "<li>Schedule one action per week to keep momentum.</li>",
  "</ol>",
  "<h3>Example focus</h3>",
  "<blockquote>Focus: Applying soon. Next lessons: Job boards, applications, company research.</blockquote>",
  "<h3>Success check</h3>",
  "<ul>",
  "<li>You know the recruiting stages and their order.</li>",
  "<li>You picked a focus that matches your timeline.</li>",
  "<li>You can name the next three lessons you will do.</li>",
  "</ul>",
].join("");

const lessonExamples = new Map<string, LessonExample>([
  [
    "start-to-finish-roadmap",
    {
      slug: "start-to-finish-roadmap",
      title: "Start to Finish Roadmap",
      summary:
        "See the recruiting sequence end-to-end and choose the right focus for your timeline.",
      focus: "A clear sequence of steps from exploration to offers.",
      deliverable: "A personalized focus and the next three lessons to complete.",
      estimatedMinutes: 20,
      outcomes: [
        "Clarity on the recruiting stages and order.",
        "A focus that matches your urgency.",
        "Three next lessons to tackle immediately.",
      ],
      checklist: [
        "Pick the focus that fits your timeline.",
        "Identify the next three lessons.",
        "Block time for weekly recruiting work.",
        "Bookmark the resources you will revisit.",
      ],
      plan: [
        {
          title: "Orient",
          detail: "Review the end-to-end stages of tech recruiting.",
        },
        {
          title: "Focus",
          detail: "Choose the path that matches your urgency.",
        },
        {
          title: "Act",
          detail: "Start the next three lessons and schedule weekly time.",
        },
      ],
      contentHtml: startToFinishContent,
    },
  ],
]);

/**
 * Return a static lesson example for the given slug.
 */
export const getLessonExample = (slug: string) => lessonExamples.get(slug) ?? null;
