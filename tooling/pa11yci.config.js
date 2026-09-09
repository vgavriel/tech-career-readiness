const baseUrl =
  process.env.PA11Y_BASE_URL ??
  process.env.BASE_URL ??
  `http://localhost:${process.env.PORT ?? 3000}`;

const chromeLaunchConfig = {
  args: ["--no-sandbox"],
};

if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  chromeLaunchConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
}

const routes = [
  `${baseUrl}/`,
  {
    url: `${baseUrl}/#focus-picker`,
    actions: [
      "wait for element #focus-picker select to be visible",
      "set field #focus-picker select to just-starting",
    ],
  },
  `${baseUrl}/lesson/ace-interview-prep-timeline`,
  {
    url: `${baseUrl}/gold-stars`,
    actions: [
      'click element button[aria-controls^="focus-menu-panel-"]',
      'wait for element [id^="focus-menu-panel-"] to be visible',
    ],
  },
  {
    url: `${baseUrl}/roles`,
    actions: [
      'click element button[aria-controls^="focus-menu-panel-"]',
      'wait for element [id^="focus-menu-panel-"] to be visible',
    ],
  },
  `${baseUrl}/privacy`,
];

module.exports = {
  defaults: {
    standard: "WCAG2AAA",
    timeout: 60000,
    wait: 1000,
    chromeLaunchConfig,
  },
  urls: routes.flatMap((route) => {
    const page = typeof route === "string" ? { url: route } : route;
    return [
      page,
      {
        ...page,
        actions: [
          "wait for element .theme-toggle:not([disabled]) to be visible",
          'click element button[aria-label="Switch to dark mode"]',
          'wait for element html[data-theme="dark"] to be visible',
          ...(page.actions ?? []),
        ],
      },
    ];
  }),
};
