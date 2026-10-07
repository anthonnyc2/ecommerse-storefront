// DOM wiring of the catalog's phone filter drawer. Choices are held until the
// shopper taps "Aplicar filtros"; the rules live in filterSelection.ts.
import {
  EMPTY_SELECTION,
  filterCount,
  selectionChanged,
  selectionFromUrl,
  urlWithSelection,
  type FilterSelection,
} from "./filterSelection";

// One choice per group: picking another one swaps it.
const GROUPS: { selector: string; key: keyof FilterSelection }[] = [
  { selector: ".category-filter-mobile", key: "category" },
  { selector: ".color-filter-mobile", key: "color" },
  { selector: ".size-filter-mobile", key: "size" },
];

const inputsOf = (selector: string) => [
  ...document.querySelectorAll<HTMLInputElement>(selector),
];

export function initFilterDrawer({
  onApply,
}: {
  /** Receives the catalog URL with the picked filters. */
  onApply: (url: string) => void;
}) {
  const applied = selectionFromUrl(new URLSearchParams(window.location.search));
  const footer = document.getElementById("mobile-filter-footer");
  const applyButton = document.getElementById("apply-filters-mobile");
  const clearButton = document.getElementById("clear-filters-mobile");

  function picked(): FilterSelection {
    const selection = { ...EMPTY_SELECTION };
    for (const { selector, key } of GROUPS) {
      selection[key] = inputsOf(selector).find((i) => i.checked)?.value ?? "";
    }
    return selection;
  }

  // The apply button shows only when the picks differ from what is applied;
  // "Limpiar filtros" only while something is applied or picked.
  function sync() {
    const selection = picked();
    const count = filterCount(selection);
    if (footer) footer.hidden = !selectionChanged(applied, selection);
    if (applyButton) {
      applyButton.textContent =
        count > 0 ? `Aplicar filtros (${count})` : "Aplicar filtros";
    }
    if (clearButton) {
      clearButton.hidden = filterCount(applied) === 0 && count === 0;
    }
  }

  /** Back to what is applied (used when the drawer closes without applying). */
  function reset() {
    for (const { selector, key } of GROUPS) {
      for (const input of inputsOf(selector)) {
        input.checked =
          applied[key] !== "" &&
          input.value.toLowerCase() === applied[key].toLowerCase();
      }
    }
    sync();
  }

  for (const { selector } of GROUPS) {
    for (const input of inputsOf(selector)) {
      input.addEventListener("change", () => {
        if (input.checked) {
          for (const other of inputsOf(selector)) {
            if (other !== input) other.checked = false;
          }
        }
        sync();
      });
    }
  }

  applyButton?.addEventListener("click", () => {
    onApply(urlWithSelection(window.location.href, picked()));
  });

  sync();
  return { reset };
}
