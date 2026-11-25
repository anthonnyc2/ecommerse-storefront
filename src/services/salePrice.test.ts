import { describe, expect, it } from "vitest";
import { priceDisplay, variantPrice } from "./salePrice";

describe("variantPrice", () => {
  it("is on sale when compareAtPrice is above price", () => {
    expect(variantPrice({ price: 120, compareAtPrice: 180 })).toEqual({
      price: 120,
      compareAt: 180,
      discount: 33,
    });
  });

  it.each([
    ["missing", null],
    ["equal", 120],
    ["lower", 100],
  ])("ignores a %s compareAtPrice", (_label, compareAtPrice) => {
    expect(variantPrice({ price: 120, compareAtPrice })).toEqual({
      price: 120,
      compareAt: null,
      discount: 0,
    });
  });
});

describe("priceDisplay", () => {
  it("shows the cheapest price and strikes its old price", () => {
    expect(
      priceDisplay([
        { price: 200, compareAtPrice: null },
        { price: 120, compareAtPrice: 180 },
      ]),
    ).toEqual({ price: 120, compareAt: 180, discount: 33, isFrom: true });
  });

  it("keeps the badge when only a pricier variant is on sale", () => {
    expect(
      priceDisplay([
        { price: 100, compareAtPrice: null },
        { price: 150, compareAtPrice: 200 },
      ]),
    ).toEqual({ price: 100, compareAt: null, discount: 25, isFrom: true });
  });

  it("uses the biggest discount for the badge", () => {
    expect(
      priceDisplay([
        { price: 90, compareAtPrice: 100 },
        { price: 90, compareAtPrice: 180 },
      ]),
    ).toEqual({ price: 90, compareAt: 180, discount: 50, isFrom: false });
  });

  it("has no sale when no variant is discounted", () => {
    expect(priceDisplay([{ price: 300, compareAtPrice: null }])).toEqual({
      price: 300,
      compareAt: null,
      discount: 0,
      isFrom: false,
    });
  });

  it("handles a product without variants", () => {
    expect(priceDisplay([])).toEqual({
      price: 0,
      compareAt: null,
      discount: 0,
      isFrom: false,
    });
  });
});
