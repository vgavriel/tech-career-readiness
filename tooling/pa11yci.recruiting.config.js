// Pa11y CI loads JavaScript configuration as CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { defaults } = require("./pa11yci.config.js");

const baseUrl =
  process.env.PA11Y_BASE_URL ??
  process.env.BASE_URL ??
  `http://localhost:${process.env.PORT ?? 3000}`;
const lessonUrl = `${baseUrl}/lesson/tech-recruiting-timeline`;
const timeline = 'main [data-testid="recruiting-timeline"]';
const calendar = `${timeline} nav[aria-label="Recruiting seasons"]`;
const currentButton = `${calendar} button[aria-current="date"]`;
const fullGuide = `${timeline} [data-testid="lesson-content"]`;
const winterHeading = "#heading=h.8tyi8dh7ov0i";

const seasons = [
  "Jul–Aug Late Summer",
  "Sep–Oct Early Fall",
  "Nov–Dec Late Fall",
  "Jan–Feb Winter",
  "Mar–Apr Spring",
  "May–Jun Early Summer",
];
const states = [
  {
    name: "current",
    actions: [`wait for element ${currentButton}[aria-pressed="true"] to be visible`],
  },
  ...seasons.map((season, index) => {
    const button = `${calendar} button[aria-label^="${season}"]`;
    return {
      name: `season-${index + 1}`,
      actions: [
        `click element ${button}`,
        `wait for element ${button}[aria-pressed="true"] to be visible`,
      ],
    };
  }),
  {
    name: "source-heading",
    hash: winterHeading,
    actions: [`wait for element ${fullGuide} to be visible`],
  },
  {
    name: "back-to-now",
    hash: winterHeading,
    actions: [
      `wait for element ${fullGuide} to be visible`,
      `click element ${timeline} button:not([aria-pressed])`,
      `wait for element ${currentButton}[aria-pressed="true"] to be visible`,
      `wait for element ${fullGuide} to be removed`,
    ],
  },
];

module.exports = {
  defaults,
  urls: [
    { name: "desktop", viewport: { width: 1280, height: 900 } },
    { name: "mobile", viewport: { width: 390, height: 844, isMobile: true } },
  ].flatMap(({ name: device, viewport }) =>
    ["light", "dark"].flatMap((theme) =>
      states.map(({ name, hash = "", actions }) => ({
        // A query label makes each state identifiable in Pa11y's CI output.
        url: `${lessonUrl}?a11y=${device}-${theme}-${name}${hash}`,
        viewport,
        actions: [
          "wait for element .theme-toggle:not([disabled]) to be visible",
          ...(theme === "dark" ? ['click element button[aria-label="Switch to dark mode"]'] : []),
          `wait for element html[data-theme="${theme}"] to be visible`,
          // This fails if generic mock HTML, the source fallback, or unhydrated HTML
          // bypasses the interactive reader. Source-heading cases also have the calendar.
          `wait for element ${currentButton} to be visible`,
          ...(device === "mobile"
            ? ['wait for element button[aria-label="Open navigator"] to be visible']
            : []),
          ...actions,
        ],
      }))
    )
  ),
};
