import { defineConfig, devices } from "@playwright/test";

process.env.NEXTAUTH_SECRET ??= "test-nextauth-secret";
process.env.GOOGLE_CLIENT_ID ??= "test-google-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-google-client-secret";
process.env.ADMIN_EMAILS ??= "dev@example.com";
process.env.LESSON_CONTENT_MOCK_HTML ??=
  "<h2>Lesson content</h2><p>Sample lesson content for tests.</p>";
process.env.APP_ENV ??= "test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3001);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
process.env.NEXTAUTH_URL ??= baseURL;
process.env.NEXT_PUBLIC_SITE_URL ??= baseURL;

export default defineConfig({
  testDir: "../e2e",
  timeout: 30_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
