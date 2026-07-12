import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import ProductCard from "../components/ProductCard.astro";
import { getCatalogProducts } from "../services/api";

/**
 * Astro Action used by the mobile infinite-scroll client on /catalogo.
 *
 * Server-renders the next page of products via `ProductCard.astro` and
 * returns the resulting HTML string plus the canonical `total` count.
 * Card markup is never duplicated on the client — `AstroContainer` keeps
 * `ProductCard.astro` as the single source of truth.
 *
 * Client usage:
 *   import { actions } from "astro:actions";
 *   const { data, error } = await actions.loadMoreCatalog({ page: 2, ... });
 */
export const server = {
  loadMoreCatalog: defineAction({
    accept: "json",
    input: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive().max(48).default(12),
      category: z.string().default(""),
      color: z.string().default(""),
      size: z.string().default(""),
      sort: z.string().default(""),
      search: z.string().default(""),
    }),
    handler: async (input) => {
      const { products, total } = await getCatalogProducts(input);

      if (products.length === 0) {
        return { html: "", total, count: 0 };
      }

      const container = await AstroContainer.create();
      const fragments = await Promise.all(
        products.map((product) =>
          container.renderToString(ProductCard, {
            props: { product, priority: false },
          }),
        ),
      );

      return { html: fragments.join(""), total, count: products.length };
    },
  }),
};