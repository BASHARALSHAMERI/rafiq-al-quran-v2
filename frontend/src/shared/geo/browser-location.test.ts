import { describe, expect, it } from "vitest";
import { geolocationErrorMessage, haversineMeters } from "./browser-location";

describe("haversineMeters", () => {
  it("uses latitude and longitude in the correct order", () => {
    const sanaaToTaiz = Math.round(haversineMeters({
      fromLat: 15.3694,
      fromLng: 44.1910,
      toLat: 13.5795,
      toLng: 44.0209,
    }));

    const swapped = Math.round(haversineMeters({
      fromLat: 44.1910,
      fromLng: 15.3694,
      toLat: 44.0209,
      toLng: 13.5795,
    }));

    expect(sanaaToTaiz).toBeGreaterThan(198_000);
    expect(sanaaToTaiz).toBeLessThan(202_000);
    expect(swapped).not.toBe(sanaaToTaiz);
  });
});

describe("geolocationErrorMessage", () => {
  it("returns a clear Arabic permission message", () => {
    const error = { code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError;
    expect(geolocationErrorMessage(error, true)).toContain("\u0625\u0630\u0646 \u0627\u0644\u0645\u0648\u0642\u0639");
  });
});
