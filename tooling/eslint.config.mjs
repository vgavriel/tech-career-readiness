import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    plugins: {
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      "import/no-unused-modules": [
        "error",
        {
          unusedExports: true,
          src: [
            "src/components/**/*.{ts,tsx}",
            "src/hooks/**/*.{ts,tsx}",
            "src/app/**/*.{ts,tsx}",
          ],
          ignoreExports: [
            "src/app/**/*.{ts,tsx}",
            "**/*.test.*",
            "**/*.spec.*",
            "**/__tests__/**",
          ],
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
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
    files: ["src/components/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
    ignores: ["src/components/app-shell.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/headers",
              message:
                "Server-only API. Move to a server component or route handler.",
            },
            {
              name: "next-auth",
              message:
                "Server-only NextAuth import. Use next-auth/react in client components.",
            },
          ],
        },
      ],
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
  eslintConfigPrettier,
];

export default eslintConfig;
