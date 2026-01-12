import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const compat = new FlatCompat({
  baseDirectory: repoRoot,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Override default ignores of eslint-config-next.
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "**/*.yml",
      "**/*.yaml",
    ],
  },
  {
    files: ["prisma/seed.js"],
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
