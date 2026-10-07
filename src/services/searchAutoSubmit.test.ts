import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MIN_SEARCH_LENGTH,
  SEARCH_DEBOUNCE_MS,
  initAutoSearch,
  restoreFocusIfRequested,
  shouldAutoSearch,
} from "./searchAutoSubmit";

const DRESS = "vestido";

describe("shouldAutoSearch", () => {
  it("searches a new term of enough length", () => {
    expect(shouldAutoSearch(DRESS, "")).toBe(true);
    expect(shouldAutoSearch("ve", "")).toBe(true);
  });

  it("waits for more than a single character", () => {
    expect(MIN_SEARCH_LENGTH).toBe(2);
    expect(shouldAutoSearch("v", "")).toBe(false);
  });

  it("ignores spaces around the term", () => {
    expect(shouldAutoSearch(`  ${DRESS}  `, DRESS)).toBe(false);
    expect(shouldAutoSearch("   ", "")).toBe(false);
  });

  it("clears the search when the field is emptied", () => {
    expect(shouldAutoSearch("", DRESS)).toBe(true);
  });

  it("does not repeat the search that is already applied", () => {
    expect(shouldAutoSearch(DRESS, DRESS)).toBe(false);
  });
});

function fakeInput(value = "") {
  const handlers: Record<string, (event: object) => void> = {};
  return {
    value,
    addEventListener: (type: string, handler: (event: object) => void) => {
      handlers[type] = handler;
    },
    handlers,
  };
}

function setup(options: { applied?: string; enabled?: boolean } = {}) {
  const input = fakeInput();
  const onSearch = vi.fn();
  const storage = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  const auto = initAutoSearch({
    input: input as unknown as HTMLInputElement,
    currentTerm: () => options.applied ?? "",
    isEnabled: () => options.enabled ?? true,
    onSearch,
  });
  const type = (text: string, event: object = {}) => {
    input.value = text;
    input.handlers.input(event);
  };
  return { input, onSearch, auto, type, storage };
}

describe("initAutoSearch", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("searches once, after the user stops typing", () => {
    const { onSearch, type } = setup();

    type("ve");
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    type("ves");
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    type(DRESS);
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith(DRESS);
  });

  it("searches the trimmed final text", () => {
    const { onSearch, type } = setup();

    type(`  ${DRESS} `);
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

    expect(onSearch).toHaveBeenCalledWith(DRESS);
  });

  it("does nothing for a single character", () => {
    const { onSearch, type } = setup();

    type("v");
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("does nothing when the text matches the applied search", () => {
    const { onSearch, type } = setup({ applied: DRESS });

    type(DRESS);
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("stays off when disabled (mobile keeps Enter only)", () => {
    const { onSearch, type } = setup({ enabled: false });

    type(DRESS);
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("does not search while an IME composition is in progress", () => {
    const { onSearch, type } = setup();

    type(DRESS, { isComposing: true });
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("can be cancelled, e.g. when Enter submits right away", () => {
    const { onSearch, auto, type } = setup();

    type(DRESS);
    auto.cancel();
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2);

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("remembers to give the field its focus back after the reload", () => {
    const { storage, type } = setup();

    type(DRESS);
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);

    expect(storage.size).toBe(1);
  });
});

describe("restoreFocusIfRequested", () => {
  afterEach(() => vi.unstubAllGlobals());

  function focusable(value: string) {
    return {
      value,
      focus: vi.fn(),
      setSelectionRange: vi.fn(),
    };
  }

  function stubStorage(initial: Record<string, string>) {
    const storage = new Map(Object.entries(initial));
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
    });
    return storage;
  }

  it("focuses the field with the caret at the end, once", () => {
    const storage = stubStorage({ rb_search_refocus: "1" });
    const input = focusable(DRESS);

    restoreFocusIfRequested(input as unknown as HTMLInputElement, () => true);

    expect(input.focus).toHaveBeenCalled();
    expect(input.setSelectionRange).toHaveBeenCalledWith(
      DRESS.length,
      DRESS.length,
    );
    expect(storage.size).toBe(0);
  });

  it("does not steal focus when nobody asked for it", () => {
    stubStorage({});
    const input = focusable(DRESS);

    restoreFocusIfRequested(input as unknown as HTMLInputElement, () => true);

    expect(input.focus).not.toHaveBeenCalled();
  });

  it("does not focus on mobile, where it would pop the keyboard up", () => {
    stubStorage({ rb_search_refocus: "1" });
    const input = focusable(DRESS);

    restoreFocusIfRequested(input as unknown as HTMLInputElement, () => false);

    expect(input.focus).not.toHaveBeenCalled();
  });

  it("survives storage being unavailable", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
    });

    expect(() =>
      restoreFocusIfRequested(
        focusable(DRESS) as unknown as HTMLInputElement,
        () => true,
      ),
    ).not.toThrow();
  });
});
