import type { CartItem } from "./cartStore";
import { priceDisplay, variantPrice, type PriceDisplay } from "./salePrice";

/** Pure variant logic behind the quick-add button on product cards. */

export interface QuickAddVariant {
  id: string;
  color: string | null;
  size: string | null;
  price: number;
  /** Old price when the variant is on sale (see salePrice.ts). */
  compareAtPrice: number | null;
}

export interface QuickAddProduct {
  slug: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  colorImages: Record<string, string>;
  variants: QuickAddVariant[];
}

export interface Selection {
  color: string;
  size: string;
}

export interface ResolvedSelection {
  needsColor: boolean;
  needsSize: boolean;
  complete: boolean;
  variant: QuickAddVariant | null;
}

// Compact wire format [id, color, size, price, compareAtPrice] keeps the card
// HTML small. Cards rendered before compareAtPrice existed send 4 items.
type VariantTuple = [
  string,
  string | null,
  string | null,
  number,
  (number | null)?,
];

export function serializeVariants(
  variants: (QuickAddVariant & { stock: number })[],
): string {
  const tuples: VariantTuple[] = variants
    .filter((v) => v.stock > 0)
    .map((v) => [v.id, v.color, v.size, v.price, v.compareAtPrice]);
  return JSON.stringify(tuples);
}

export function parseVariants(raw: string | undefined): QuickAddVariant[] {
  if (!raw) return [];
  try {
    const tuples: unknown = JSON.parse(raw);
    if (!Array.isArray(tuples)) return [];
    return (tuples as VariantTuple[]).map(
      ([id, color, size, price, compareAtPrice]) => ({
        id,
        color,
        size,
        price,
        compareAtPrice: compareAtPrice ?? null,
      }),
    );
  } catch {
    return [];
  }
}

export function needsChoice(variants: QuickAddVariant[]): boolean {
  return variants.length > 1;
}

function uniqueValues(
  variants: QuickAddVariant[],
  key: "color" | "size",
): string[] {
  const values = variants.map((v) => v[key]).filter((v): v is string => !!v);
  return [...new Set(values)];
}

export const colorsOf = (variants: QuickAddVariant[]) =>
  uniqueValues(variants, "color");

export function sizesForColor(
  variants: QuickAddVariant[],
  color: string,
): string[] {
  const scoped = color ? variants.filter((v) => v.color === color) : variants;
  return uniqueValues(scoped, "size");
}

/** A dimension with a single option is chosen for the shopper. */
export function initialSelection(variants: QuickAddVariant[]): Selection {
  const colors = colorsOf(variants);
  const sizes = sizesForColor(variants, "");
  return {
    color: colors.length === 1 ? colors[0] : "",
    size: sizes.length === 1 ? sizes[0] : "",
  };
}

export function pickColor(
  variants: QuickAddVariant[],
  current: Selection,
  color: string,
): Selection {
  const sizes = sizesForColor(variants, color);
  if (sizes.length === 1) return { color, size: sizes[0] };
  return { color, size: sizes.includes(current.size) ? current.size : "" };
}

export function resolveSelection(
  variants: QuickAddVariant[],
  selection: Selection,
): ResolvedSelection {
  const needsColor = colorsOf(variants).length > 1;
  const needsSize = sizesForColor(variants, "").length > 1;
  const complete =
    (!needsColor || !!selection.color) && (!needsSize || !!selection.size);
  const variant = complete
    ? (variants.find(
        (v) =>
          (!needsColor || v.color === selection.color) &&
          (!needsSize || v.size === selection.size),
      ) ?? null)
    : null;
  return { needsColor, needsSize, complete, variant };
}

export function displayPrice(
  variants: QuickAddVariant[],
  variant: QuickAddVariant | null,
): PriceDisplay {
  if (variant) return { ...variantPrice(variant), isFrom: false };
  return priceDisplay(variants);
}

export function toCartItem(
  product: QuickAddProduct,
  variant: QuickAddVariant,
): Omit<CartItem, "quantity"> {
  const colorImage = variant.color ? product.colorImages[variant.color] : "";
  return {
    id: variant.id,
    slug: product.slug,
    name: product.name,
    price: variant.price,
    image: colorImage || product.image,
    size: variant.size ?? undefined,
    color: variant.color ?? undefined,
    brand: product.brand,
  };
}
