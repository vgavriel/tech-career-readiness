import path from "node:path";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
    setupFiles: [path.resolve(__dirname, "./vitest.setup.ts")],
    exclude: [
      ...configDefaults.exclude,
      "**/*.integration.test.*",
      "e2e/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
    },
  },
});
