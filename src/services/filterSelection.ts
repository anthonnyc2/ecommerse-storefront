// Filter choices of the catalog. Each of category, color and size can hold
// several values (Café and Negro together); they travel in the URL as comma
// separated lists, which is what the products API expects: values of one
// group are OR-ed, and the groups are AND-ed.

export interface FilterSelection {
  category: string[];
  color: string[];
  size: string[];
}

export const emptySelection = (): FilterSelection => ({
  category: [],
  color: [],
  size: [],
});

const KEYS = ["category", "color", "size"] as const;

/** "Café,Negro" -> ["Café", "Negro"]. Empty or missing gives []. */
export function parseList(csv: string | null | undefined): string[] {
  return (csv ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function selectionFromUrl(params: URLSearchParams): FilterSelection {
  return {
    category: parseList(params.get("category")),
    color: parseList(params.get("color")),
    size: parseList(params.get("size")),
  };
}

/** How many values are picked across the three groups. */
export function filterCount(selection: FilterSelection): number {
  return KEYS.reduce((total, key) => total + selection[key].length, 0);
}

const asSet = (values: string[]) => new Set(values.map((v) => v.toLowerCase()));

/** True when the picked filters differ from the applied ones (ignores case and order). */
export function selectionChanged(
  applied: FilterSelection,
  pending: FilterSelection,
): boolean {
  return KEYS.some((key) => {
    const before = asSet(applied[key]);
    const after = asSet(pending[key]);
    return before.size !== after.size || [...before].some((v) => !after.has(v));
  });
}

/** The catalog URL with the picked filters. Keeps search and sort, goes back to page 1. */
export function urlWithSelection(
  href: string,
  selection: FilterSelection,
): string {
  const url = new URL(href);
  for (const key of KEYS) {
    if (selection[key].length > 0) {
      url.searchParams.set(key, selection[key].join(","));
    } else {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.delete("page");
  return url.toString();
}
