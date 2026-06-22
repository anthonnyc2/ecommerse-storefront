import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import sonarjs from "eslint-plugin-sonarjs";

export default tseslint.config(
  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Astro recommended rules
  ...eslintPluginAstro.configs.recommended,

  // SonarJS recommended rules
  sonarjs.configs.recommended,

  {
    // Configure TypeScript parser for Astro components
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".astro"],
      },
    },
  },

  {
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // SonarJS customizations
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-duplicate-string": "error",
      "sonarjs/no-commented-code": "off",

      // Astro rules
      "astro/no-set-html-directive": "error",
    },
  },

  {
    // Global ignores
    ignores: ["dist/", ".astro/", "node_modules/", "src/env.d.ts", ".vercel/"],
  },
);
