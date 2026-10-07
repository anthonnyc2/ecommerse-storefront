/**
 * Searches the catalog by itself once the shopper stops typing (desktop only).
 * The catalog reloads the page on every search, which closes the keyboard on
 * phones, so there the search still waits for Enter or the button.
 */

export const SEARCH_DEBOUNCE_MS = 400;
export const MIN_SEARCH_LENGTH = 2;

const REFOCUS_KEY = "rb_search_refocus";

/** An emptied field clears the search; a single character is too vague. */
export function shouldAutoSearch(typed: string, applied: string): boolean {
  const next = typed.trim();
  if (next === applied.trim()) return false;
  return next.length === 0 || next.length >= MIN_SEARCH_LENGTH;
}

interface AutoSearchOptions {
  input: HTMLInputElement;
  /** The term the page is currently showing results for. */
  currentTerm: () => string;
  /** Auto search is off where the reload would hide the keyboard. */
  isEnabled: () => boolean;
  onSearch: (term: string) => void;
  delayMs?: number;
}

function rememberRefocus() {
  try {
    sessionStorage.setItem(REFOCUS_KEY, "1");
  } catch {
    // Storage blocked: the shopper just clicks the field again.
  }
}

/** After the reload caused by a typed search, put the cursor back in the field. */
export function restoreFocusIfRequested(
  input: HTMLInputElement,
  isEnabled: () => boolean,
) {
  try {
    if (!sessionStorage.getItem(REFOCUS_KEY)) return;
    sessionStorage.removeItem(REFOCUS_KEY);
  } catch {
    return;
  }
  if (!isEnabled()) return;
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

export function initAutoSearch(options: AutoSearchOptions) {
  const { input, currentTerm, isEnabled, onSearch } = options;
  const delayMs = options.delayMs ?? SEARCH_DEBOUNCE_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  // Decided when the timer fires, so it judges the final text, not each key.
  const fire = () => {
    timer = undefined;
    if (!isEnabled() || !shouldAutoSearch(input.value, currentTerm())) return;
    rememberRefocus();
    onSearch(input.value.trim());
  };

  input.addEventListener("input", (event) => {
    if ((event as InputEvent).isComposing) return;
    cancel();
    timer = setTimeout(fire, delayMs);
  });

  return { cancel };
}
