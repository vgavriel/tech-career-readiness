import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts", "src/**/*.integration.test.tsx"],
    setupFiles: [path.resolve(__dirname, "./vitest.integration.setup.ts")],
    fileParallelism: false,
    // Integration tests hit a real Postgres and cold-import route modules, so
    // give them more room than Vitest's 5s/10s unit-test defaults.
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },
});
