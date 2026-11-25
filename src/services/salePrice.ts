// Sale prices. A variant is on sale when the admin sets `compareAtPrice`
// (the old price) above `price` (what the shopper pays now).

export interface PricedVariant {
  price: number;
  compareAtPrice: number | null;
}

export interface VariantPrice {
  price: number;
  /** Old price to strike through, or null when the variant is not on sale. */
  compareAt: number | null;
  /** Whole percent off, 0 when not on sale. */
  discount: number;
}

export interface PriceDisplay extends VariantPrice {
  /** True when the variants have different prices ("Desde X Bs"). */
  isFrom: boolean;
}

export function variantPrice({
  price,
  compareAtPrice,
}: PricedVariant): VariantPrice {
  if (compareAtPrice === null || compareAtPrice <= price) {
    return { price, compareAt: null, discount: 0 };
  }
  return {
    price,
    compareAt: compareAtPrice,
    discount: Math.round((1 - price / compareAtPrice) * 100),
  };
}

/**
 * Price of a whole product: the cheapest price, the old price of that cheapest
 * variant, and the biggest discount of any variant (for the "-X%" badge).
 */
export function priceDisplay(variants: PricedVariant[]): PriceDisplay {
  const prices = variants.map(variantPrice);
  if (prices.length === 0) {
    return { price: 0, compareAt: null, discount: 0, isFrom: false };
  }
  const price = Math.min(...prices.map((p) => p.price));
  const oldPrices = prices
    .filter((p) => p.price === price && p.compareAt !== null)
    .map((p) => p.compareAt as number);
  return {
    price,
    compareAt: oldPrices.length > 0 ? Math.max(...oldPrices) : null,
    discount: Math.max(...prices.map((p) => p.discount)),
    isFrom: prices.some((p) => p.price !== price),
  };
}
