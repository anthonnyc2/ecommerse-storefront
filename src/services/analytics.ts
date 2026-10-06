import Clarity from "@microsoft/clarity";

const CURRENCY = "BOB";
const PERCENT = 100;
const MS_PER_SECOND = 1000;

/**
 * `item_id` is always the product slug so every event (card click, product
 * page, cart) refers to the same product. The variant goes in `item_variant`.
 */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
}

export type ContactPlacement =
  "footer" | "home_cta" | "cart" | "contacto" | "product";

export interface AnalyticsEvents {
  view_item_list: { item_list_name: string; items: AnalyticsItem[] };
  select_item: { item_list_name: string; items: AnalyticsItem[] };
  view_item: { value?: number; items: AnalyticsItem[] };
  product_engagement: {
    item_id: string;
    engagement_time_msec: number;
    scroll_depth: number;
  };
  select_variant: {
    item_id: string;
    variant_type: "color" | "size";
    variant_value: string;
  };
  out_of_stock_view: { item_id: string; item_variant: string };
  search_catalog: { search_term: string; results_count: number };
  filter_catalog: {
    filter_type: string;
    filter_value: string;
    results_count: number;
  };
  paginate_catalog: { page_number: number; item_list_name: string };
  add_to_cart: { value: number; items: AnalyticsItem[] };
  remove_from_cart: { value: number; items: AnalyticsItem[] };
  view_cart: { value: number; items: AnalyticsItem[] };
  begin_checkout: { value: number; items: AnalyticsItem[] };
  click_contact: {
    contact_method: string;
    placement: ContactPlacement;
    item_id?: string;
  };
  click_social: { network: string; placement: ContactPlacement };
}

export type AnalyticsEventName = keyof AnalyticsEvents;

const CLARITY_MILESTONES = new Set<AnalyticsEventName>([
  "view_item",
  "add_to_cart",
  "begin_checkout",
  "click_contact",
]);

function sendToGa4(name: string, params: Record<string, unknown>) {
  if (typeof gtag !== "function") {
    if (import.meta.env.DEV) console.debug("[analytics]", name, params);
    return;
  }
  const withCurrency =
    "value" in params ? { currency: CURRENCY, ...params } : params;
  gtag("event", name, { transport_type: "beacon", ...withCurrency });
}

function sendToClarity(name: string) {
  try {
    Clarity.event(name);
  } catch {
    // Clarity not initialised yet or blocked: analytics must never break the page.
  }
}

export function track<K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEvents[K],
) {
  sendToGa4(name, params);
  if (CLARITY_MILESTONES.has(name)) sendToClarity(name);
}

function itemFromDataset(el: HTMLElement, index: number): AnalyticsItem {
  const { itemId, itemName, itemCategory, itemBrand, price } = el.dataset;
  return {
    item_id: itemId ?? "",
    item_name: itemName ?? "",
    item_category: itemCategory || undefined,
    item_brand: itemBrand || undefined,
    price: price ? Number(price) : undefined,
    index,
  };
}

export function itemsFromGrid(grid: HTMLElement): AnalyticsItem[] {
  const cards = grid.querySelectorAll<HTMLElement>(":scope > [data-item-id]");
  return Array.from(cards, (card, index) => itemFromDataset(card, index));
}

function trackDelegatedClick(el: HTMLElement) {
  const placement = el.dataset.placement as ContactPlacement;
  switch (el.dataset.track) {
    case "click_contact":
      track("click_contact", {
        contact_method: el.dataset.contactMethod ?? "whatsapp",
        placement,
      });
      break;
    case "click_social":
      track("click_social", { network: el.dataset.network ?? "", placement });
      break;
    case "select_item": {
      const siblings = Array.from(el.parentElement?.children ?? []);
      const index = siblings.indexOf(el);
      const listName =
        el.closest<HTMLElement>("[data-list-name]")?.dataset.listName ??
        "catalogo";
      track("select_item", {
        item_list_name: listName,
        items: [itemFromDataset(el, index)],
      });
      break;
    }
  }
}

/** One document-level listener for every element marked with `data-track`. */
export function initClickTracking() {
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    const el = target?.closest<HTMLElement>("[data-track]");
    if (el) trackDelegatedClick(el);
  });
}

function trackProductEngagement(itemId: string) {
  let visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
  let visibleMs = 0;
  let maxScroll = 0;
  let sent = false;

  const updateScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) {
      maxScroll = PERCENT;
      return;
    }
    const depth = Math.round((window.scrollY / scrollable) * PERCENT);
    maxScroll = Math.max(maxScroll, Math.min(depth, PERCENT));
  };

  const flush = () => {
    if (sent) return;
    if (visibleSince) visibleMs += Date.now() - visibleSince;
    if (visibleMs < MS_PER_SECOND) return;
    sent = true;
    track("product_engagement", {
      item_id: itemId,
      engagement_time_msec: visibleMs,
      scroll_depth: maxScroll,
    });
  };

  window.addEventListener("scroll", updateScroll, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flush();
      visibleSince = 0;
    } else {
      visibleSince = Date.now();
      sent = false;
      visibleMs = 0;
    }
  });
  window.addEventListener("pagehide", flush);
  updateScroll();
}

/** Pages mark their product root with `data-track-engagement="<slug>"`. */
export function initEngagementTracking() {
  const root = document.querySelector<HTMLElement>("[data-track-engagement]");
  if (root?.dataset.trackEngagement) {
    trackProductEngagement(root.dataset.trackEngagement);
  }
}
