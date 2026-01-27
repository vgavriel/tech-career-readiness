import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    // Override default ignores of eslint-config-next.
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "**/*.yml",
      "**/*.yaml",
    ],
  },
  {
    files: ["prisma/seed.js", "prisma/seed-runner.js", "prisma/seed.testdata.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: [
      "**/__tests__/**",
      "**/*.test.*",
      "**/*.spec.*",
    ],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
