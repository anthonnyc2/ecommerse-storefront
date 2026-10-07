import { describe, expect, it } from "vitest";
import { pickHeroTiles } from "./heroCollage";
import type { PublicProductWithDetails } from "../types/api";

const product = (
  slug: string,
  overrides: Partial<PublicProductWithDetails> & { stock?: number } = {},
): PublicProductWithDetails => {
  const { stock = 1, ...rest } = overrides;
  return {
    id: slug,
    name: slug.toUpperCase(),
    slug,
    description: null,
    category: "Vestidos",
    brand: null,
    active: true,
    variants: [
      {
        id: `${slug}-v`,
        productId: slug,
        sku: slug,
        price: 100,
        compareAtPrice: null,
        color: null,
        size: "S",
        stock,
      },
    ],
    images: [
      {
        id: "b",
        productId: slug,
        url: `${slug}-b.webp`,
        position: 1,
        color: null,
      },
      {
        id: "a",
        productId: slug,
        url: `${slug}-a.webp`,
        position: 0,
        color: null,
      },
    ],
    ...rest,
  };
};

const loaderFor =
  (products: PublicProductWithDetails[]) => async (slug: string) =>
    products.find((p) => p.slug === slug) ?? null;

describe("pickHeroTiles", () => {
  it("takes the first photo (by position) of the first in-stock product", async () => {
    const tiles = await pickHeroTiles(
      [["a"], ["b"]],
      loaderFor([product("a"), product("b", { category: "Conjuntos" })]),
    );

    expect(tiles).toEqual([
      { slug: "a", name: "A", category: "Vestidos", image: "a-a.webp" },
      { slug: "b", name: "B", category: "Conjuntos", image: "b-a.webp" },
    ]);
  });

  it("falls back to the next candidate when the first is sold out", async () => {
    const tiles = await pickHeroTiles(
      [["a", "a2"]],
      loaderFor([product("a", { stock: 0 }), product("a2")]),
    );

    expect(tiles.map((t) => t.slug)).toEqual(["a2"]);
  });

  it("skips a slot whose candidates are all unavailable", async () => {
    const tiles = await pickHeroTiles(
      [["gone"], ["b"]],
      loaderFor([product("b")]),
    );

    expect(tiles.map((t) => t.slug)).toEqual(["b"]);
  });

  it("ignores inactive products and products without photos or category", async () => {
    const tiles = await pickHeroTiles(
      [["inactive"], ["nophoto"], ["nocat"]],
      loaderFor([
        product("inactive", { active: false }),
        product("nophoto", { images: [] }),
        product("nocat", { category: null }),
      ]),
    );

    expect(tiles).toEqual([]);
  });
});
