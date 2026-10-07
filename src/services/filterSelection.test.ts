import { describe, expect, it } from "vitest";
import {
  emptySelection,
  filterCount,
  parseList,
  selectionChanged,
  selectionFromUrl,
  urlWithSelection,
} from "./filterSelection";

const pick = (overrides: Partial<ReturnType<typeof emptySelection>>) => ({
  ...emptySelection(),
  ...overrides,
});

describe("parseList", () => {
  it("splits a comma separated list and drops blanks", () => {
    expect(parseList("Café, Negro,,")).toEqual(["Café", "Negro"]);
  });

  it("is empty for nothing", () => {
    expect(parseList("")).toEqual([]);
    expect(parseList(null)).toEqual([]);
    expect(parseList(undefined)).toEqual([]);
  });
});

describe("selectionFromUrl", () => {
  it("reads several values per filter and defaults to empty", () => {
    const params = new URLSearchParams(
      "category=Blusas&color=CAFE,NEGRO&search=rojo",
    );
    expect(selectionFromUrl(params)).toEqual({
      category: ["Blusas"],
      color: ["CAFE", "NEGRO"],
      size: [],
    });
    expect(selectionFromUrl(new URLSearchParams())).toEqual(emptySelection());
  });
});

describe("filterCount", () => {
  it("counts every picked value", () => {
    expect(filterCount(emptySelection())).toBe(0);
    expect(filterCount(pick({ color: ["CAFE", "NEGRO"] }))).toBe(2);
    expect(
      filterCount(pick({ category: ["A"], color: ["B", "C"], size: ["S"] })),
    ).toBe(4);
  });
});

describe("selectionChanged", () => {
  it("is false when nothing is picked and nothing is applied", () => {
    expect(selectionChanged(emptySelection(), emptySelection())).toBe(false);
  });

  it("is true when a value is added, swapped or removed", () => {
    expect(selectionChanged(emptySelection(), pick({ size: ["M"] }))).toBe(
      true,
    );
    expect(selectionChanged(pick({ size: ["M"] }), pick({ size: ["S"] }))).toBe(
      true,
    );
    expect(
      selectionChanged(
        pick({ color: ["CAFE"] }),
        pick({ color: ["CAFE", "NEGRO"] }),
      ),
    ).toBe(true);
    expect(selectionChanged(pick({ size: ["M"] }), emptySelection())).toBe(
      true,
    );
  });

  it("ignores letter case and order", () => {
    expect(
      selectionChanged(
        pick({ color: ["cafe", "negro"] }),
        pick({ color: ["NEGRO", "CAFE"] }),
      ),
    ).toBe(false);
  });
});

describe("urlWithSelection", () => {
  const base = "https://raquel-boutique.com/catalogo";

  it("joins several values of a filter with commas", () => {
    const url = new URL(
      urlWithSelection(
        base,
        pick({ category: ["Blusas"], color: ["CAFE", "NEGRO"], size: ["M"] }),
      ),
    );
    expect(url.searchParams.get("category")).toBe("Blusas");
    expect(url.searchParams.get("color")).toBe("CAFE,NEGRO");
    expect(url.searchParams.get("size")).toBe("M");
  });

  it("removes filters that are no longer picked", () => {
    const url = urlWithSelection(
      `${base}?category=Blusas&size=M`,
      emptySelection(),
    );
    expect(url).toBe(base);
  });

  it("keeps search and sort and goes back to page 1", () => {
    const url = new URL(
      urlWithSelection(
        `${base}?search=rojo&sort=price-asc&page=3&color=Azul`,
        pick({ size: ["S"] }),
      ),
    );
    expect(url.searchParams.get("search")).toBe("rojo");
    expect(url.searchParams.get("sort")).toBe("price-asc");
    expect(url.searchParams.get("page")).toBeNull();
    expect(url.searchParams.get("size")).toBe("S");
    expect(url.searchParams.get("color")).toBeNull();
  });
});
