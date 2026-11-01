/** Photos a product card may show: only colors that are still in stock. */

interface CardImage {
  url: string;
  color: string | null;
}

interface CardVariant {
  color: string | null;
  stock: number;
}

export function pickCardImages(
  images: CardImage[],
  variants: CardVariant[],
): string[] {
  const inStock = new Set(
    variants.filter((v) => v.stock > 0 && v.color).map((v) => v.color),
  );
  const eligible = images.filter((i) => !i.color || inStock.has(i.color));
  // Never leave the card without a photo.
  return (eligible.length > 0 ? eligible : images).map((i) => i.url);
}
