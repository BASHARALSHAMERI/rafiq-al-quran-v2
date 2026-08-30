import { describe, expect, it } from "vitest";
import { circlePolygon, fromMapLngLat, toMapLngLat } from "./map-coordinates";

describe("map coordinate helpers", () => {
  it("keeps system latitude/longitude separate from MapLibre longitude/latitude", () => {
    const point = { latitude: 13.5795, longitude: 44.0209 };
    expect(toMapLngLat(point)).toEqual([44.0209, 13.5795]);
    expect(fromMapLngLat({ lng: 44.0209, lat: 13.5795 })).toEqual(point);
  });

  it("builds a closed geofence polygon", () => {
    const polygon = circlePolygon({ latitude: 13.5795, longitude: 44.0209 }, 500, 12);
    const ring = polygon.geometry.coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(ring.length).toBe(13);
  });
});
