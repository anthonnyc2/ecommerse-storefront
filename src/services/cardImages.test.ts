import { describe, expect, it } from "vitest";
import { pickCardImages } from "./cardImages";

const img = (url: string, color: string | null) => ({ url, color });

describe("pickCardImages", () => {
  it("skips photos of colors that are out of stock", () => {
    const images = [img("pink-1", "ROSADO"), img("red-1", "ROJO")];
    const variants = [
      { color: "ROSADO", stock: 0 },
      { color: "ROJO", stock: 2 },
    ];
    expect(pickCardImages(images, variants)).toEqual(["red-1"]);
  });

  it("keeps photos with no color", () => {
    const images = [
      img("pink-1", "ROSADO"),
      img("any", null),
      img("red-1", "ROJO"),
    ];
    const variants = [{ color: "ROJO", stock: 1 }];
    expect(pickCardImages(images, variants)).toEqual(["any", "red-1"]);
  });

  it("keeps every photo when all colors are in stock", () => {
    const images = [img("a", "ROSADO"), img("b", "ROJO")];
    const variants = [
      { color: "ROSADO", stock: 1 },
      { color: "ROJO", stock: 1 },
    ];
    expect(pickCardImages(images, variants)).toEqual(["a", "b"]);
  });

  it("falls back to all photos when nothing matches", () => {
    const images = [img("a", "ROSADO")];
    expect(pickCardImages(images, [{ color: "ROJO", stock: 1 }])).toEqual([
      "a",
    ]);
    expect(pickCardImages(images, [])).toEqual(["a"]);
  });
});
