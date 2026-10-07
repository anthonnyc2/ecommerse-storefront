// Pure helpers of the product detail page: stock and price labels, and the
// WhatsApp order message. The page script is `is:inline` and cannot import,
// so the page computes the labels on the server and hands them to the script.

export const WHATSAPP_PHONE = "59165864255";
const LOW_STOCK_LIMIT = 3;

export type StockTone = "ok" | "low" | "out";

export interface StockStatus {
  text: string;
  tone: StockTone;
}

export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return { text: "Agotado", tone: "out" };
  if (stock === 1) return { text: "Última unidad", tone: "low" };
  if (stock <= LOW_STOCK_LIMIT) return { text: `Quedan ${stock}`, tone: "low" };
  return { text: "En stock", tone: "ok" };
}

/** Status of the whole product, before the shopper picks a variant. */
export function totalStockStatus(variants: { stock: number }[]): StockStatus {
  return stockStatus(variants.reduce((sum, v) => sum + v.stock, 0));
}

/** "300 Bs", or "Desde 250 Bs" when the variants have different prices. */
export function priceLabel(prices: number[]): string {
  if (prices.length === 0) return "";
  const min = Math.min(...prices);
  const prefix = min === Math.max(...prices) ? "" : "Desde ";
  return `${prefix}${min} Bs`;
}

export interface OrderItem {
  name: string;
  color?: string;
  size?: string;
  price: number;
  url: string;
}

export function buildOrderMessage(item: OrderItem): string {
  const options = [
    item.color && `Color: ${item.color}`,
    item.size && `Talla: ${item.size}`,
  ].filter(Boolean);
  return [
    "¡Hola! Me gustaría pedir este producto de Raquel Boutique:",
    "",
    `• 1x *${item.name}*`,
    ...(options.length > 0 ? [`  (${options.join(", ")})`] : []),
    `  Precio: ${item.price} Bs`,
    "",
    item.url,
    "",
    "¿Me confirman la disponibilidad?",
  ].join("\n");
}

export function whatsappUrl(message: string): string {
  return `https://api.whatsapp.com/send/?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(message)}`;
}
