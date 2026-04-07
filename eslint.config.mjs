import eslintPluginAstro from "eslint-plugin-astro";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  // add more generic rules objects here
  sonarjs.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      // customize rules
      // "astro/no-set-html-directive": "error"
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-duplicate-string": "error",
    },
  },
  {
    ignores: [".astro/*", "dist/*", "node_modules/*"],
  },
];
