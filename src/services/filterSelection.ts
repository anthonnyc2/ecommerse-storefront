// Filter choices of the catalog's phone drawer. The shopper picks category,
// color and size first and applies them together; these helpers decide when
// the apply button shows and what URL it opens.

export interface FilterSelection {
  category: string;
  color: string;
  size: string;
}

export const EMPTY_SELECTION: FilterSelection = {
  category: "",
  color: "",
  size: "",
};

const KEYS = ["category", "color", "size"] as const;

export function selectionFromUrl(params: URLSearchParams): FilterSelection {
  return {
    category: params.get("category") ?? "",
    color: params.get("color") ?? "",
    size: params.get("size") ?? "",
  };
}

/** How many of category, color and size have a value. */
export function filterCount(selection: FilterSelection): number {
  return KEYS.filter((key) => selection[key] !== "").length;
}

/** True when the picked filters differ from the applied ones (ignores case). */
export function selectionChanged(
  applied: FilterSelection,
  pending: FilterSelection,
): boolean {
  return KEYS.some(
    (key) => applied[key].toLowerCase() !== pending[key].toLowerCase(),
  );
}

/** The catalog URL with the picked filters. Keeps search and sort, goes back to page 1. */
export function urlWithSelection(
  href: string,
  selection: FilterSelection,
): string {
  const url = new URL(href);
  for (const key of KEYS) {
    if (selection[key]) url.searchParams.set(key, selection[key]);
    else url.searchParams.delete(key);
  }
  url.searchParams.delete("page");
  return url.toString();
}
