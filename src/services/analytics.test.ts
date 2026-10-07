import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Clarity from "@microsoft/clarity";
import { initClickTracking, track } from "./analytics";

vi.mock("@microsoft/clarity", () => ({
  default: { event: vi.fn(), setTag: vi.fn() },
}));

const gtagMock = vi.fn();
const WHATSAPP = "whatsapp";
const FOOTER = "footer";
const BLOUSE_ID = "blusa-rosa";
const BLOUSE_NAME = "Blusa Rosa";
let clickHandler: (event: { target: unknown }) => void;

// jsdom cannot start in this repo (undici version mismatch), so the DOM is faked.
// `card` models the product card that wraps the clicked link.
function fakeClick(
  dataset: Record<string, string>,
  options: {
    listName?: string;
    position?: number;
    card?: Record<string, string>;
  } = {},
) {
  const siblings = [{}, {}, {}];
  const list = options.listName
    ? { dataset: { listName: options.listName } }
    : null;
  const card = {
    dataset: options.card ?? {},
    parentElement: { children: siblings },
    closest: () => list,
  };
  const tracked = {
    dataset,
    parentElement: card,
    closest: (selector: string) =>
      selector === "[data-item-id]" ? card : list,
  };
  siblings[options.position ?? 0] = card;
  clickHandler({ target: { closest: () => tracked } });
}

beforeAll(() => {
  vi.stubGlobal("document", {
    addEventListener: (_type: string, handler: typeof clickHandler) => {
      clickHandler = handler;
    },
  });
  initClickTracking();
});

beforeEach(() => {
  gtagMock.mockClear();
  vi.mocked(Clarity.event).mockClear();
  vi.mocked(Clarity.setTag).mockReset();
  vi.stubGlobal("gtag", gtagMock);
});

describe("track", () => {
  it("sends the event to GA4 with beacon transport", () => {
    track("search_catalog", { search_term: "vestido", results_count: 0 });

    expect(gtagMock).toHaveBeenCalledWith("event", "search_catalog", {
      transport_type: "beacon",
      search_term: "vestido",
      results_count: 0,
    });
  });

  it("adds the BOB currency to events that carry a value", () => {
    track("begin_checkout", { value: 120, items: [] });

    expect(gtagMock).toHaveBeenCalledWith(
      "event",
      "begin_checkout",
      expect.objectContaining({ currency: "BOB", value: 120 }),
    );
  });

  it("forwards only milestone events to Clarity", () => {
    track("filter_catalog", {
      filter_type: "color",
      filter_value: "rojo",
      results_count: 3,
    });
    expect(Clarity.event).not.toHaveBeenCalled();

    track("click_contact", { contact_method: WHATSAPP, placement: FOOTER });
    expect(Clarity.event).toHaveBeenCalledWith("click_contact");
  });

  it("does not throw when GA4 is blocked", () => {
    vi.stubGlobal("gtag", undefined);

    expect(() =>
      track("click_social", { network: "instagram", placement: "contacto" }),
    ).not.toThrow();
  });
});

describe("page_not_found", () => {
  it("reports the missing path and where the visitor came from", () => {
    track("page_not_found", {
      page_path: "/producto/viejo",
      referrer: "https://raquelboutique.vercel.app/",
    });

    expect(gtagMock).toHaveBeenCalledWith("event", "page_not_found", {
      transport_type: "beacon",
      page_path: "/producto/viejo",
      referrer: "https://raquelboutique.vercel.app/",
    });
    expect(Clarity.setTag).not.toHaveBeenCalled();
  });
});

describe("Clarity tags", () => {
  it("tags the product on view_item", () => {
    track("view_item", {
      items: [{ item_id: BLOUSE_ID, item_name: BLOUSE_NAME }],
    });

    expect(Clarity.setTag).toHaveBeenCalledWith("producto", BLOUSE_ID);
  });

  it("sends the search term and whether it found results", () => {
    track("search_catalog", { search_term: "vestido", results_count: 0 });

    expect(Clarity.setTag).toHaveBeenCalledWith("busqueda", "vestido");
    expect(Clarity.setTag).toHaveBeenCalledWith(
      "busqueda_resultados",
      "sin resultados",
    );

    track("search_catalog", { search_term: "blusa", results_count: 4 });
    expect(Clarity.setTag).toHaveBeenCalledWith(
      "busqueda_resultados",
      "con resultados",
    );
  });

  it("tags where the contact click happened", () => {
    track("click_contact", { contact_method: WHATSAPP, placement: FOOTER });

    expect(Clarity.setTag).toHaveBeenCalledWith("contacto", FOOTER);
  });

  it("does not tag events without a tag builder", () => {
    track("paginate_catalog", { page_number: 2, item_list_name: "catalogo" });

    expect(Clarity.setTag).not.toHaveBeenCalled();
  });

  it("still sends to GA4 when Clarity throws", () => {
    vi.mocked(Clarity.setTag).mockImplementation(() => {
      throw new Error("clarity blocked");
    });

    expect(() =>
      track("click_contact", { contact_method: WHATSAPP, placement: "cart" }),
    ).not.toThrow();
    expect(gtagMock).toHaveBeenCalledWith(
      "event",
      "click_contact",
      expect.objectContaining({ placement: "cart" }),
    );
  });
});

describe("initClickTracking", () => {
  it("tracks click_contact with its placement", () => {
    fakeClick({ track: "click_contact", placement: "home_cta" });

    expect(gtagMock).toHaveBeenCalledWith("event", "click_contact", {
      transport_type: "beacon",
      contact_method: WHATSAPP,
      placement: "home_cta",
    });
  });

  it("adds the product to click_contact when the link belongs to one", () => {
    fakeClick({
      track: "click_contact",
      placement: "product",
      itemId: BLOUSE_ID,
    });

    expect(gtagMock).toHaveBeenCalledWith("event", "click_contact", {
      transport_type: "beacon",
      contact_method: WHATSAPP,
      placement: "product",
      item_id: BLOUSE_ID,
    });
  });

  it("tracks click_social with its network", () => {
    fakeClick({
      track: "click_social",
      network: "tiktok",
      placement: "contacto",
    });

    expect(gtagMock).toHaveBeenCalledWith("event", "click_social", {
      transport_type: "beacon",
      network: "tiktok",
      placement: "contacto",
    });
  });

  it("tracks select_item with the card position and list name", () => {
    fakeClick(
      { track: "select_item" },
      {
        listName: "busqueda",
        position: 2,
        card: {
          itemId: BLOUSE_ID,
          itemName: BLOUSE_NAME,
          itemCategory: "Blusas",
          itemBrand: "",
          price: "89",
        },
      },
    );

    expect(gtagMock).toHaveBeenCalledWith("event", "select_item", {
      transport_type: "beacon",
      item_list_name: "busqueda",
      items: [
        {
          item_id: BLOUSE_ID,
          item_name: BLOUSE_NAME,
          item_category: "Blusas",
          item_brand: undefined,
          price: 89,
          index: 2,
        },
      ],
    });
  });

  it("ignores clicks outside tracked elements", () => {
    clickHandler({ target: { closest: () => null } });

    expect(gtagMock).not.toHaveBeenCalled();
  });
});
