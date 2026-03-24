// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import clarity from "@kbyte-tech/astro-clarity";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    clarity({
      enabled: true,
      projectId: import.meta.env.CLARITY_PROJECT_ID,
    }),
  ],
});
