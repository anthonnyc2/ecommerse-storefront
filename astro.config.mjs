// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

import sentry from "@sentry/astro";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sentry({
      project: "catalogo-rb",
      org: "democompany-0j",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
