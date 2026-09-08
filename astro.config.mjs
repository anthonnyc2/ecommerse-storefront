import process from "node:process";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";

import sentry from "@sentry/astro";

const env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");


// https://astro.build/config
export default defineConfig({
  site: "https://raquel-boutique.com",
  output: "server",
  adapter: node({ mode: "standalone" }),

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap(),
    sentry({
      project: "catalogo-rb",
      org: "democompany-0j",
      authToken: env.PUBLIC_SENTRY_AUTH_TOKEN,
    }),
  ],
});
