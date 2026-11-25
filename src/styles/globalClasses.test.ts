import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Guards the shared UI classes of `global.css` (btn, choice, chip, ...):
// a typo or a deleted utility would otherwise only show up as an unstyled
// element in the browser.

const SRC = join(__dirname, "..");
const css = readFileSync(join(__dirname, "global.css"), "utf8");
const defined = new Set(
  [...css.matchAll(/@utility ([\w-]+)/g)].map((match) => match[1]),
);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    const isSource = /\.(astro|ts)$/.test(entry.name);
    return isSource && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

const files = sourceFiles(SRC).map((path) => ({
  path: path.replace(`${SRC}/`, "src/"),
  text: readFileSync(path, "utf8"),
}));

// Names that are only ours: `btn`, `btn-*`, `choice*`, `chip*`, ...
const OWN_CLASS =
  /^(btn(-[a-z]+)*|choice(-[a-z]+)?|chip(-more)?|panel-title|filter-title|focus-ring)$/;
const SALE_CLASS = /^(sale-badge|price-old)$/;
const isOwnClass = (token: string) =>
  OWN_CLASS.test(token) || SALE_CLASS.test(token);
// `field` and `check` are common words, so they only count inside class attributes.
const AMBIGUOUS_CLASS = /^(field|check)$/;

const withoutVariants = (token: string) => token.split(":").pop() ?? token;
const tokensOf = (text: string) =>
  text.split(/[^\w:/.[\]-]+/).map(withoutVariants);

function classAttributeValues(text: string): string[] {
  // class="..." | class={`...${x}...`} | class:list={[...]}
  const attribute =
    /class(?::list)?=(?:"([^"]*)"|\{`([^`]*)`\}|\{(\[[^\]]*\])\})/g;
  return [...text.matchAll(attribute)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");
}

function usedClasses() {
  const used = new Map<string, Set<string>>();
  const add = (name: string, path: string) => {
    if (!used.has(name)) used.set(name, new Set());
    used.get(name)?.add(path);
  };
  for (const { path, text } of files) {
    for (const token of tokensOf(text)) {
      if (isOwnClass(token)) add(token, path);
    }
    for (const value of classAttributeValues(text)) {
      for (const token of tokensOf(value)) {
        if (AMBIGUOUS_CLASS.test(token)) add(token, path);
      }
    }
  }
  return used;
}

describe("global.css utilities", () => {
  it("finds the utilities and the source files", () => {
    expect(defined.size).toBeGreaterThan(20);
    expect(files.length).toBeGreaterThan(10);
  });

  it("defines every shared class the code uses", () => {
    const missing = [...usedClasses()]
      .filter(([name]) => !defined.has(name))
      .map(([name, paths]) => `${name} (${[...paths].join(", ")})`);
    expect(missing).toEqual([]);
  });

  it("uses every utility it defines", () => {
    const used = usedClasses();
    const unused = [...defined].filter((name) => !used.has(name));
    expect(unused).toEqual([]);
  });

  it("keeps hex colors and pixel font sizes out of class names", () => {
    const arbitrary = /\b(?:bg|text|border|ring)-\[(?:#|\d+px)/;
    const offenders = files
      .filter(({ text }) => arbitrary.test(text))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });
});
