import type { APIRoute } from "astro";
import { getAllProductSitemapEntries } from "../services/api";

const SITEMAP_CACHE_SECONDS = 3600;

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The static sitemap from @astrojs/sitemap cannot see SSR product pages, so
// products get their own sitemap, listed in the index via `customSitemaps`.
export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL("https://raquel-boutique.com");
  const entries = await getAllProductSitemapEntries();

  const urls = entries
    .map(({ slug, updatedAt }) => {
      const loc = escapeXml(new URL(`/producto/${slug}`, origin).href);
      const lastmod = updatedAt
        ? `<lastmod>${new Date(updatedAt).toISOString()}</lastmod>`
        : "";
      return `<url><loc>${loc}</loc>${lastmod}</url>`;
    })
    .join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=${SITEMAP_CACHE_SECONDS}`,
    },
  });
};
