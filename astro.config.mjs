import process from "node:process";
import { URL } from "node:url";
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
    sitemap({
      customSitemaps: ["https://raquel-boutique.com/sitemap-productos.xml"],
      // Canonical URLs have no trailing slash; keep the sitemap consistent.
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== "/")
          url.pathname = url.pathname.replace(/\/$/, "");
        return { ...item, url: url.href };
      },
    }),
    sentry({
      project: "catalogo-rb",
      org: "democompany-0j",
      authToken: env.PUBLIC_SENTRY_AUTH_TOKEN,
    }),
  ],
});
