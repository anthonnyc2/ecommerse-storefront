import { describe, expect, it } from "vitest";
import {
  buildOrderMessage,
  priceLabel,
  stockStatus,
  totalStockStatus,
  whatsappUrl,
} from "./productPage";

describe("stockStatus", () => {
  it.each([
    [0, "Agotado", "out"],
    [-1, "Agotado", "out"],
    [1, "Última unidad", "low"],
    [2, "Quedan 2", "low"],
    [3, "Quedan 3", "low"],
    [4, "En stock", "ok"],
    [20, "En stock", "ok"],
  ])("%i units", (stock, text, tone) => {
    expect(stockStatus(stock)).toEqual({ text, tone });
  });

  it("adds the stock of every variant", () => {
    expect(totalStockStatus([{ stock: 1 }, { stock: 1 }]).text).toBe(
      "Quedan 2",
    );
    expect(totalStockStatus([{ stock: 0 }, { stock: 0 }]).tone).toBe("out");
    expect(totalStockStatus([])).toEqual({ text: "Agotado", tone: "out" });
  });
});

describe("priceLabel", () => {
  it("shows one price when every variant costs the same", () => {
    expect(priceLabel([300, 300])).toBe("300 Bs");
  });

  it("says Desde when prices differ", () => {
    expect(priceLabel([280, 300])).toBe("Desde 280 Bs");
  });

  it("is empty without variants", () => {
    expect(priceLabel([])).toBe("");
  });
});

describe("buildOrderMessage", () => {
  const base = {
    name: "Lenceria Mod-122",
    price: 300,
    url: "https://raquel-boutique.com/producto/lenceria-mod-122",
  };

  it("lists the chosen options, price and link", () => {
    const message = buildOrderMessage({ ...base, color: "Negro", size: "S" });
    expect(message).toContain("• 1x *Lenceria Mod-122*");
    expect(message).toContain("(Color: Negro, Talla: S)");
    expect(message).toContain("Precio: 300 Bs");
    expect(message).toContain(base.url);
  });

  it("leaves out the options line when there are none", () => {
    expect(buildOrderMessage(base)).not.toContain("(");
  });

  it("keeps a single option on its own", () => {
    expect(buildOrderMessage({ ...base, size: "M" })).toContain("(Talla: M)");
  });
});

describe("whatsappUrl", () => {
  it("encodes the message for the shop number", () => {
    const url = whatsappUrl("Hola, ¿qué tal?");
    expect(url).toContain("phone=59165864255");
    expect(decodeURIComponent(url.split("text=")[1])).toBe("Hola, ¿qué tal?");
  });
});
