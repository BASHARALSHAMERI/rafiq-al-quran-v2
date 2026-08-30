import { describe, expect, it } from "vitest";
import { ARABIC_NAME_EXPRESSION, shouldUseArabicNameLabel } from "./maplibre-style";

describe("MapLibre Arabic label helpers", () => {
  it("prefers name:ar then name then name:en", () => {
    expect(ARABIC_NAME_EXPRESSION).toEqual([
      "coalesce",
      ["get", "name:ar"],
      ["get", "name"],
      ["get", "name:en"]
    ]);
  });

  it("updates name labels but skips road reference shields", () => {
    expect(shouldUseArabicNameLabel({ id: "place-city", type: "symbol", layout: { "text-field": ["get", "name"] } })).toBe(true);
    expect(shouldUseArabicNameLabel({ id: "road-shield", type: "symbol", layout: { "text-field": ["get", "ref"] } })).toBe(false);
  });
});
