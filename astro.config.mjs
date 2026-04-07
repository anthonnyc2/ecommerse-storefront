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
      dsn: process.env.SENTRY_DSN,
      // Record 0% of traces in development, 50% in production.
      tracesSampleRate: process.env.NODE_ENV === "development" ? 0 : 0.5,
    }),
  ],
});
