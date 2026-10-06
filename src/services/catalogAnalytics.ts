import { itemsFromGrid, track } from "./analytics";

const LAST_QUERY_KEY = "rb_catalog_query";
const FILTER_PARAMS = ["category", "color", "size", "sort"] as const;
const FIRST_PAGE = 1;

function isRepeatVisit(query: string): boolean {
  try {
    const repeated = sessionStorage.getItem(LAST_QUERY_KEY) === query;
    sessionStorage.setItem(LAST_QUERY_KEY, query);
    return repeated;
  } catch {
    return false;
  }
}

function trackQuery(params: URLSearchParams, resultsCount: number) {
  const searchTerm = params.get("search");
  if (searchTerm) {
    track("search_catalog", {
      search_term: searchTerm.toLowerCase(),
      results_count: resultsCount,
    });
  }
  for (const filterType of FILTER_PARAMS) {
    const filterValue = params.get(filterType);
    if (filterValue) {
      track("filter_catalog", {
        filter_type: filterType,
        filter_value: filterValue,
        results_count: resultsCount,
      });
    }
  }
}

export function trackPageLoaded(page: number, listName: string) {
  track("paginate_catalog", { page_number: page, item_list_name: listName });
}

/**
 * Runs on every catalog load. Search, filters and pagination all reload the
 * page, so the result is read from the server-rendered grid instead of being
 * sent on click (the click would race the navigation).
 */
export function trackCatalogView() {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  const listName = grid.dataset.listName ?? "catalogo";
  const resultsCount = Number(grid.dataset.total ?? 0);
  track("view_item_list", {
    item_list_name: listName,
    items: itemsFromGrid(grid),
  });

  if (isRepeatVisit(window.location.search)) return;
  const params = new URLSearchParams(window.location.search);
  trackQuery(params, resultsCount);
  const page = Number(params.get("page") ?? FIRST_PAGE);
  if (page > FIRST_PAGE) trackPageLoaded(page, listName);
}
