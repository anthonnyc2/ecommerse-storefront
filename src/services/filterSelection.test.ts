import { describe, expect, it } from "vitest";
import {
  EMPTY_SELECTION,
  filterCount,
  selectionChanged,
  selectionFromUrl,
  urlWithSelection,
} from "./filterSelection";

const pick = (overrides: Partial<typeof EMPTY_SELECTION>) => ({
  ...EMPTY_SELECTION,
  ...overrides,
});

describe("selectionFromUrl", () => {
  it("reads the three filters and defaults to empty", () => {
    const params = new URLSearchParams("category=Blusas&size=M&search=rojo");
    expect(selectionFromUrl(params)).toEqual({
      category: "Blusas",
      color: "",
      size: "M",
    });
    expect(selectionFromUrl(new URLSearchParams())).toEqual(EMPTY_SELECTION);
  });
});

describe("filterCount", () => {
  it("counts the filters that have a value", () => {
    expect(filterCount(EMPTY_SELECTION)).toBe(0);
    expect(filterCount(pick({ color: "Negro" }))).toBe(1);
    expect(filterCount(pick({ category: "A", color: "B", size: "S" }))).toBe(3);
  });
});

describe("selectionChanged", () => {
  it("is false when nothing is picked and nothing is applied", () => {
    expect(selectionChanged(EMPTY_SELECTION, EMPTY_SELECTION)).toBe(false);
  });

  it("is true when a filter is added, changed or removed", () => {
    expect(selectionChanged(EMPTY_SELECTION, pick({ size: "M" }))).toBe(true);
    expect(selectionChanged(pick({ size: "M" }), pick({ size: "S" }))).toBe(
      true,
    );
    expect(selectionChanged(pick({ size: "M" }), EMPTY_SELECTION)).toBe(true);
  });

  it("ignores letter case", () => {
    expect(
      selectionChanged(pick({ color: "negro" }), pick({ color: "NEGRO" })),
    ).toBe(false);
  });
});

describe("urlWithSelection", () => {
  const base = "https://raquel-boutique.com/catalogo";

  it("sets several filters at once", () => {
    const url = new URL(
      urlWithSelection(
        base,
        pick({ category: "Blusas", color: "Negro", size: "M" }),
      ),
    );
    expect(url.searchParams.get("category")).toBe("Blusas");
    expect(url.searchParams.get("color")).toBe("Negro");
    expect(url.searchParams.get("size")).toBe("M");
  });

  it("removes filters that are no longer picked", () => {
    const url = urlWithSelection(
      `${base}?category=Blusas&size=M`,
      EMPTY_SELECTION,
    );
    expect(url).toBe(base);
  });

  it("keeps search and sort and goes back to page 1", () => {
    const url = new URL(
      urlWithSelection(
        `${base}?search=rojo&sort=price-asc&page=3&color=Azul`,
        pick({ size: "S" }),
      ),
    );
    expect(url.searchParams.get("search")).toBe("rojo");
    expect(url.searchParams.get("sort")).toBe("price-asc");
    expect(url.searchParams.get("page")).toBeNull();
    expect(url.searchParams.get("size")).toBe("S");
    expect(url.searchParams.get("color")).toBeNull();
  });
});
