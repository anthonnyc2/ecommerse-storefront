import { describe, expect, it } from "vitest";
import {
  displayPrice,
  initialSelection,
  needsChoice,
  parseVariants,
  pickColor,
  resolveSelection,
  serializeVariants,
  sizesForColor,
  toCartItem,
  type QuickAddProduct,
  type QuickAddVariant,
} from "./quickAdd";

const RED = "ROJO";
const BLUE = "AZUL";
const NO_SELECTION = { color: "", size: "" };

const variant = (
  id: string,
  color: string | null,
  size: string | null,
  price = 100,
): QuickAddVariant => ({ id, color, size, price });

// Rojo: S, M. Azul: M, L (price differs).
const MIXED = [
  variant("v1", RED, "S"),
  variant("v2", RED, "M"),
  variant("v3", BLUE, "M", 120),
  variant("v4", BLUE, "L", 120),
];

describe("serializeVariants / parseVariants", () => {
  it("round-trips only the variants that are in stock", () => {
    const json = serializeVariants([
      { id: "a", color: RED, size: "S", price: 90, stock: 3 },
      { id: "b", color: RED, size: "M", price: 90, stock: 0 },
    ]);

    expect(parseVariants(json)).toEqual([variant("a", RED, "S", 90)]);
  });

  it("returns an empty list for missing or broken data", () => {
    expect(parseVariants(undefined)).toEqual([]);
    expect(parseVariants("not json")).toEqual([]);
    expect(parseVariants('{"a":1}')).toEqual([]);
  });
});

describe("needsChoice", () => {
  it("is false for zero or one variant and true for several", () => {
    expect(needsChoice([])).toBe(false);
    expect(needsChoice([variant("a", RED, "S")])).toBe(false);
    expect(needsChoice(MIXED)).toBe(true);
  });
});

describe("initialSelection", () => {
  it("pre-selects a dimension that has a single option", () => {
    const onlySizes = [variant("a", RED, "S"), variant("b", RED, "M")];

    expect(initialSelection(onlySizes)).toEqual({ color: RED, size: "" });
    expect(initialSelection(MIXED)).toEqual(NO_SELECTION);
  });

  it("leaves absent dimensions empty", () => {
    const onlyColors = [variant("a", RED, null), variant("b", BLUE, null)];

    expect(initialSelection(onlyColors)).toEqual(NO_SELECTION);
  });
});

describe("sizesForColor", () => {
  it("lists only the sizes that exist for that color", () => {
    expect(sizesForColor(MIXED, RED)).toEqual(["S", "M"]);
    expect(sizesForColor(MIXED, BLUE)).toEqual(["M", "L"]);
  });

  it("lists every size while no color is chosen", () => {
    expect(sizesForColor(MIXED, "")).toEqual(["S", "M", "L"]);
  });
});

describe("pickColor", () => {
  it("keeps the size when the new color also has it", () => {
    expect(pickColor(MIXED, { color: RED, size: "M" }, BLUE)).toEqual({
      color: BLUE,
      size: "M",
    });
  });

  it("clears a size the new color does not have", () => {
    expect(pickColor(MIXED, { color: RED, size: "S" }, BLUE)).toEqual({
      color: BLUE,
      size: "",
    });
  });

  it("auto-selects the size when the color has only one", () => {
    const variants = [variant("a", RED, "S"), variant("b", BLUE, "L")];

    expect(pickColor(variants, NO_SELECTION, BLUE)).toEqual({
      color: BLUE,
      size: "L",
    });
  });
});

describe("resolveSelection", () => {
  it("is incomplete until every needed dimension is chosen", () => {
    expect(resolveSelection(MIXED, NO_SELECTION).variant).toBeNull();
    expect(
      resolveSelection(MIXED, { color: RED, size: "" }).variant,
    ).toBeNull();
  });

  it("resolves the exact variant once color and size are chosen", () => {
    const result = resolveSelection(MIXED, { color: BLUE, size: "L" });

    expect(result.complete).toBe(true);
    expect(result.variant?.id).toBe("v4");
  });

  it("does not resolve a color and size pair that does not exist", () => {
    const result = resolveSelection(MIXED, { color: RED, size: "L" });

    expect(result.variant).toBeNull();
  });

  it("only asks for the dimensions that vary", () => {
    const onlySizes = [variant("a", RED, "S"), variant("b", RED, "M")];
    const result = resolveSelection(onlySizes, { color: RED, size: "M" });

    expect(result).toMatchObject({
      needsColor: false,
      needsSize: true,
      complete: true,
    });
    expect(result.variant?.id).toBe("b");
  });
});

describe("displayPrice", () => {
  it("shows the lowest price as 'from' until a variant is chosen", () => {
    expect(displayPrice(MIXED, null)).toEqual({ price: 100, isFrom: true });
  });

  it("shows the exact price of the chosen variant", () => {
    expect(displayPrice(MIXED, MIXED[2])).toEqual({
      price: 120,
      isFrom: false,
    });
  });

  it("does not say 'from' when every variant costs the same", () => {
    const same = [variant("a", RED, "S", 80), variant("b", RED, "M", 80)];

    expect(displayPrice(same, null)).toEqual({ price: 80, isFrom: false });
  });
});

describe("toCartItem", () => {
  const product: QuickAddProduct = {
    slug: "blusa-rosa",
    name: "Blusa Rosa",
    brand: "RB",
    category: "Blusas",
    image: "/main.jpg",
    colorImages: { [BLUE]: "/azul.jpg" },
    variants: MIXED,
  };

  it("builds the same cart item the product page does", () => {
    expect(toCartItem(product, MIXED[3])).toEqual({
      id: "v4",
      slug: "blusa-rosa",
      name: "Blusa Rosa",
      price: 120,
      image: "/azul.jpg",
      size: "L",
      color: BLUE,
      brand: "RB",
    });
  });

  it("falls back to the main image when the color has none", () => {
    expect(toCartItem(product, MIXED[0]).image).toBe("/main.jpg");
  });

  it("omits size and color when the variant has none", () => {
    const item = toCartItem(product, variant("x", null, null));

    expect(item.size).toBeUndefined();
    expect(item.color).toBeUndefined();
  });
});
