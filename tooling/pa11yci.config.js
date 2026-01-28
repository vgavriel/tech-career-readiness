const baseUrl =
  process.env.PA11Y_BASE_URL ??
  process.env.BASE_URL ??
  `http://localhost:${process.env.PORT ?? 3000}`;

module.exports = {
  defaults: {
    standard: "WCAG2AAA",
    timeout: 60000,
    wait: 1000,
    chromeLaunchConfig: {
      args: ["--no-sandbox"],
    },
  },
  urls: [
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
        'click element button[aria-controls="focus-menu-panel"]',
        "wait for element #focus-menu-panel to be visible",
      ],
    },
    {
      url: `${baseUrl}/roles`,
      actions: [
        'click element button[aria-controls="focus-menu-panel"]',
        "wait for element #focus-menu-panel to be visible",
      ],
    },
  ],
};
