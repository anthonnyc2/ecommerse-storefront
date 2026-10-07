import { addItem } from "./cartStore";
import { listNameOf, track } from "./analytics";
import {
  colorsOf,
  displayPrice,
  initialSelection,
  needsChoice,
  parseVariants,
  pickColor,
  resolveSelection,
  sizesForColor,
  toCartItem,
  type QuickAddProduct,
  type QuickAddVariant,
  type Selection,
} from "./quickAdd";

/** Wires the "Agregar" button on product cards and the variant picker. */

const FLASH_MS = 1500;
// Only the background changes: the button already has text-white.
const ADDED_CLASS = "bg-green-600";
const IDLE_CLASS = "bg-gray-900";
const OPTION_BASE =
  "rounded-md border px-3 py-1.5 text-sm font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const OPTION_IDLE = "border-gray-300 text-gray-700 hover:border-gray-900";
const OPTION_SELECTED = "border-secondary bg-secondary/10 text-plum";

interface SheetState {
  product: QuickAddProduct;
  card: HTMLElement;
  opener: HTMLElement;
  selection: Selection;
}

interface SheetParts {
  dialog: HTMLDialogElement;
  title: HTMLElement;
  image: HTMLImageElement;
  price: HTMLElement;
  colorsGroup: HTMLElement;
  colors: HTMLElement;
  sizesGroup: HTMLElement;
  sizes: HTMLElement;
  hint: HTMLElement;
  confirm: HTMLButtonElement;
}

let state: SheetState | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function readSheetParts(): SheetParts | null {
  const parts = {
    dialog: byId<HTMLDialogElement>("quick-add-dialog"),
    title: byId("quick-add-title"),
    image: byId<HTMLImageElement>("quick-add-image"),
    price: byId("quick-add-price"),
    colorsGroup: byId("quick-add-colors-group"),
    colors: byId("quick-add-colors"),
    sizesGroup: byId("quick-add-sizes-group"),
    sizes: byId("quick-add-sizes"),
    hint: byId("quick-add-hint"),
    confirm: byId<HTMLButtonElement>("quick-add-confirm"),
  };
  return Object.values(parts).every(Boolean) ? (parts as SheetParts) : null;
}

function parseColorImages(raw: string | undefined): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

function productFromCard(card: HTMLElement): QuickAddProduct {
  const data = card.dataset;
  return {
    slug: data.itemId ?? "",
    name: data.itemName ?? "",
    brand: data.itemBrand ?? "",
    category: data.itemCategory ?? "",
    image: data.image ?? "",
    colorImages: parseColorImages(data.colorImages),
    variants: parseVariants(data.variants),
  };
}

function variantLabel(variant: QuickAddVariant): string {
  return [variant.color, variant.size].filter(Boolean).join(" / ");
}

function announce(message: string) {
  const status = byId("quick-add-status");
  if (status) status.textContent = message;
}

function showIcon(button: HTMLElement, which: "idle" | "done") {
  button.querySelectorAll<HTMLElement>("[data-icon]").forEach((icon) => {
    icon.classList.toggle("hidden", icon.dataset.icon !== which);
  });
}

function flashAdded(button: HTMLElement) {
  showIcon(button, "done");
  button.classList.replace(IDLE_CLASS, ADDED_CLASS);
  setTimeout(() => {
    showIcon(button, "idle");
    button.classList.replace(ADDED_CLASS, IDLE_CLASS);
  }, FLASH_MS);
}

function addVariant(
  product: QuickAddProduct,
  variant: QuickAddVariant,
  card: HTMLElement,
  button: HTMLElement,
) {
  track("add_to_cart", {
    value: variant.price,
    items: [
      {
        item_id: product.slug,
        item_name: product.name,
        item_category: product.category || undefined,
        item_brand: product.brand || undefined,
        item_variant: variantLabel(variant),
        item_list_name: listNameOf(card),
        price: variant.price,
        quantity: 1,
      },
    ],
  });
  addItem(toCartItem(product, variant));
  flashAdded(button);
  announce(`${product.name} agregado al carrito`);
}

function renderOptions(
  container: HTMLElement,
  values: string[],
  selected: string,
  isAvailable: (value: string) => boolean,
) {
  const buttons = values.map((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = value.toLowerCase();
    button.dataset.value = value;
    button.disabled = !isAvailable(value);
    button.setAttribute("aria-pressed", String(value === selected));
    button.className = `${OPTION_BASE} ${value === selected ? OPTION_SELECTED : OPTION_IDLE}`;
    return button;
  });
  container.replaceChildren(...buttons);
}

function hintFor(needsColor: boolean, needsSize: boolean, s: Selection) {
  const missingColor = needsColor && !s.color;
  const missingSize = needsSize && !s.size;
  if (missingColor && missingSize) return "Elige un color y una talla";
  if (missingColor) return "Elige un color";
  if (missingSize) return "Elige una talla";
  return "";
}

function renderSheet(parts: SheetParts, current: SheetState) {
  const { product, selection } = current;
  const { variants, colorImages } = product;
  const resolved = resolveSelection(variants, selection);
  const { price, isFrom } = displayPrice(variants, resolved.variant);

  parts.price.textContent = `${isFrom ? "Desde " : ""}${price} Bs`;
  parts.image.src = colorImages[selection.color] || product.image;
  parts.colorsGroup.classList.toggle("hidden", !resolved.needsColor);
  parts.sizesGroup.classList.toggle("hidden", !resolved.needsSize);
  renderOptions(parts.colors, colorsOf(variants), selection.color, () => true);
  const sizesNow = sizesForColor(variants, selection.color);
  renderOptions(
    parts.sizes,
    sizesForColor(variants, ""),
    selection.size,
    (size) => sizesNow.includes(size),
  );
  parts.hint.textContent = hintFor(
    resolved.needsColor,
    resolved.needsSize,
    selection,
  );
  parts.confirm.disabled = !resolved.variant;
}

function openSheet(card: HTMLElement, opener: HTMLElement) {
  const parts = readSheetParts();
  if (!parts) return;
  const product = productFromCard(card);
  state = {
    product,
    card,
    opener,
    selection: initialSelection(product.variants),
  };
  parts.title.textContent = product.name;
  parts.image.alt = product.name;
  renderSheet(parts, state);
  parts.dialog.showModal();
}

function confirmSheet(parts: SheetParts) {
  if (!state) return;
  const { product, card, opener, selection } = state;
  const { variant } = resolveSelection(product.variants, selection);
  if (!variant) return;
  addVariant(product, variant, card, opener);
  parts.dialog.close();
}

function pickOption(parts: SheetParts, kind: "color" | "size", value: string) {
  if (!state) return;
  const { product, selection } = state;
  state.selection =
    kind === "color"
      ? pickColor(product.variants, selection, value)
      : { ...selection, size: value };
  renderSheet(parts, state);
}

function bindSheet(parts: SheetParts) {
  const bindPicker = (container: HTMLElement, kind: "color" | "size") =>
    container.addEventListener("click", (event) => {
      const option = (event.target as Element).closest<HTMLElement>(
        "[data-value]",
      );
      if (option?.dataset.value) pickOption(parts, kind, option.dataset.value);
    });
  bindPicker(parts.colors, "color");
  bindPicker(parts.sizes, "size");
  parts.confirm.addEventListener("click", () => confirmSheet(parts));
  byId("quick-add-close")?.addEventListener("click", () =>
    parts.dialog.close(),
  );
  // Only the backdrop is the dialog itself: the content lives in an inner div.
  parts.dialog.addEventListener("click", (event) => {
    if (event.target === parts.dialog) parts.dialog.close();
  });
  parts.dialog.addEventListener("close", () => {
    state = null;
  });
}

function handleQuickAdd(card: HTMLElement, button: HTMLElement) {
  const variants = parseVariants(card.dataset.variants);
  if (variants.length === 0) return;
  if (needsChoice(variants)) {
    openSheet(card, button);
    return;
  }
  addVariant(productFromCard(card), variants[0], card, button);
}

export function initQuickAdd() {
  const parts = readSheetParts();
  if (parts) bindSheet(parts);
  document.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest<HTMLElement>(
      "[data-quick-add]",
    );
    const card = button?.closest<HTMLElement>("[data-item-id]");
    if (button && card) handleQuickAdd(card, button);
  });
}
