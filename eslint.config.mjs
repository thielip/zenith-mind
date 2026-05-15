// eslint.config.mjs — ESLint 9 Flat Config
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import jsxA11y from "eslint-plugin-jsx-a11y";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // WCAG 2.1 AA 無障礙規範（CI 必須 0 error）
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
    },
  },

  // TypeScript 嚴格規則
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "no-empty": ["error", { allowEmptyCatch: false }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },

  { ignores: [".next/**", "node_modules/**", "prisma/migrations/**"] },
];

export default eslintConfig;
