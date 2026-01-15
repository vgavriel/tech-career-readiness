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

const defineYourGoalContent = [
  "<h2>Why this lesson matters</h2>",
  "<p>Applying everywhere feels active, but it rarely creates momentum. A clear goal gives every next step focus, makes outreach easier, and helps you track real progress.</p>",
  "<h3>Your outcome</h3>",
  "<ul>",
  "<li><strong>Target role statement</strong> - one sentence that names level, domain, and location.</li>",
  "<li><strong>Role short list</strong> - 3 to 5 roles or teams you would accept today.</li>",
  "<li><strong>Weekly rhythm</strong> - a schedule you can repeat without burning out.</li>",
  "</ul>",
  "<h3>Step-by-step</h3>",
  "<ol>",
  "<li>Write your north star sentence: I want to be a ____ in ____ by ____.</li>",
  "<li>List constraints: location, visa, salary floor, start date.</li>",
  "<li>Draft 10 companies or teams that fit your constraints.</li>",
  "<li>Set a weekly cadence for applications, networking, and practice.</li>",
  "</ol>",
  "<h3>Template</h3>",
  "<table>",
  "<thead><tr><th>Field</th><th>Draft</th></tr></thead>",
  "<tbody>",
  "<tr><td>Target role</td><td>New grad backend engineer in fintech, NYC or remote</td></tr>",
  "<tr><td>Constraints</td><td>Visa support, start date after May, salary floor 100k</td></tr>",
  "<tr><td>Role list</td><td>Backend, platform, reliability, data infrastructure</td></tr>",
  "<tr><td>Weekly cadence</td><td>4 applications, 4 outreaches, 3 practice sessions</td></tr>",
  "</tbody>",
  "</table>",
  "<h3>Example deliverable</h3>",
  "<blockquote>Target role: New grad backend engineer focused on platform reliability. Constraints: NYC or remote, visa support, start in June. Weekly plan: 4 targeted applications, 4 referrals or outreaches, 3 practice sessions.</blockquote>",
  "<h3>Success check</h3>",
  "<ul>",
  "<li>You can explain your target role in one sentence.</li>",
  "<li>You can list 5 companies without searching.</li>",
  "<li>Your weekly plan fits your actual schedule.</li>",
  "</ul>",
].join("");

const lessonExamples = new Map<string, LessonExample>([
  [
    "define-your-goal",
    {
      slug: "define-your-goal",
      title: "Define Your Goal",
      summary:
        "Turn a vague job search into a clear target role, constraints, and weekly plan you can sustain.",
      focus: "Target role statement and constraints that guide every next step.",
      deliverable: "One-page goal sheet with role list and weekly cadence.",
      estimatedMinutes: 25,
      outcomes: [
        "A one sentence target role statement.",
        "Constraints that keep your search focused.",
        "A weekly cadence you can commit to.",
      ],
      checklist: [
        "Write your target role sentence.",
        "List 3 to 5 role types you would accept.",
        "Identify constraints that matter most.",
        "Block your weekly recruiting time.",
      ],
      plan: [
        {
          title: "Clarify",
          detail: "Name the level, domain, and location you are aiming for.",
        },
        {
          title: "Constrain",
          detail: "Define the limits that keep your search realistic.",
        },
        {
          title: "Commit",
          detail: "Set a weekly cadence you can maintain for 8 to 12 weeks.",
        },
      ],
      contentHtml: defineYourGoalContent,
    },
  ],
]);

export const getLessonExample = (slug: string) =>
  lessonExamples.get(slug) ?? null;
