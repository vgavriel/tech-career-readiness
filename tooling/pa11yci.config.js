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
    `${baseUrl}/lesson/ace-interview-prep-timeline`,
    `${baseUrl}/gold-stars`,
    `${baseUrl}/roles`,
  ],
};
