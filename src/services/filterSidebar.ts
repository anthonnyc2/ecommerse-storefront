// DOM wiring of the catalog's desktop filter sidebar: every choice applies at
// once, and a group (category, color, size) can hold several values.

const GROUPS = [
  { selector: ".category-filter", param: "category" },
  { selector: ".color-filter", param: "color" },
  { selector: ".size-filter", param: "size" },
];

const checkedValues = (inputs: HTMLInputElement[]) =>
  inputs.filter((input) => input.checked).map((input) => input.value);

export function initFilterSidebar({
  onChange,
}: {
  /** `values` is the group's full list, comma separated ("" when none). */
  onChange: (param: string, values: string) => void;
}) {
  for (const { selector, param } of GROUPS) {
    const inputs = [...document.querySelectorAll<HTMLInputElement>(selector)];
    for (const input of inputs) {
      input.addEventListener("change", () => {
        onChange(param, checkedValues(inputs).join(","));
      });
    }
  }
}
