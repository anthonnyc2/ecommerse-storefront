import type { PublicProductWithDetails } from "../types/api";

export interface HeroTile {
  slug: string;
  name: string;
  category: string;
  image: string;
}

/**
 * One slot per category, each with its photos' products in order of
 * preference. These photos are clean (no supplier watermarks or badges); a
 * slot falls back to the next product when the first one has sold out.
 */
export const HERO_SLOTS: string[][] = [
  ["vestido-lana", "vestido-jazmin"],
  ["conjunto-celina", "conjunto-aisha"],
  ["conjunto-miranda", "conjunto-itzel"],
];

export const HERO_TILE_COUNT = HERO_SLOTS.length;

function toTile(product: PublicProductWithDetails | null): HeroTile | null {
  if (!product?.active || !product.category) return null;
  if (!product.variants.some((variant) => variant.stock > 0)) return null;
  const [first] = [...product.images].sort((a, b) => a.position - b.position);
  if (!first) return null;
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    image: first.url,
  };
}

/** The first in-stock product of each slot. Slots with none are skipped. */
export async function pickHeroTiles(
  slots: string[][],
  load: (slug: string) => Promise<PublicProductWithDetails | null>,
): Promise<HeroTile[]> {
  const loaded = await Promise.all(
    slots.map((slugs) => Promise.all(slugs.map(load))),
  );
  const tiles: HeroTile[] = [];
  for (const candidates of loaded) {
    const tile = candidates.map(toTile).find(Boolean);
    if (tile) tiles.push(tile);
  }
  return tiles;
}
