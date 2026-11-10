// OrGanap's ESLint flat config — uses the Next 16 idiom (spread
// `eslint-config-next/core-web-vitals` + `typescript`) and augments it
// with Prettier, import-order, unused-imports, and project rules.
//
// Reference: https://nextjs.org/docs/app/api-reference/config/eslint

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import unusedImports from "eslint-plugin-unused-imports";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "unused-imports": unusedImports,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      // ── Project preferences ─────────────────────────────────────
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react/self-closing-comp": "warn",
      "react/jsx-sort-props": [
        "warn",
        {
          callbacksLast: true,
          shorthandFirst: true,
          noSortAlphabetically: false,
          reservedFirst: true,
        },
      ],

      // ── Imports ─────────────────────────────────────────────────
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          ignoreRestSiblings: false,
          argsIgnorePattern: "^_.*?$",
        },
      ],
      "import/order": [
        "warn",
        {
          groups: [
            "type",
            "builtin",
            "object",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
        },
      ],
      "import/no-unresolved": "off",
      "import/namespace": "off",

      // ── Padding around statements ───────────────────────────────
      "padding-line-between-statements": [
        "warn",
        { blankLine: "always", prev: "*", next: "return" },
        {
          blankLine: "always",
          prev: ["const", "let", "var"],
          next: "*",
        },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
      ],
    },
  },
  prettier,
  globalIgnores([
    ".next/**",
    ".agents/**",
    "**/node_modules/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "*.config.js",
    "*.config.mjs",
  ]),
]);
