import { defineConfig } from "@playwright/test";

import { recruitingFixtureHtml } from "../e2e/fixtures/recruiting-timeline";
import base from "./playwright.config";

// A separate server run prevents generic mock content from bypassing the real reader.
// The app already supports this local/test-only override; production fetching is unchanged.
process.env.LESSON_CONTENT_MOCK_HTML = recruitingFixtureHtml;

// Keep this suite's documented device coverage explicit as the base suite grows.
const recruitingProjects = new Set(["startup", "chromium", "iphone-se-webkit", "iphone-15-webkit"]);

export default defineConfig({
  ...base,
  testIgnore: [],
  projects: base.projects
    ?.filter((project) => recruitingProjects.has(project.name ?? ""))
    .map((project) => ({
      ...project,
      testMatch: project.name === "startup" ? "startup.setup.ts" : "recruiting-timeline.spec.ts",
    })),
});
