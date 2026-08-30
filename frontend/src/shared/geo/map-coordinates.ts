export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export function isValidGeoPoint(point: GeoPoint | null | undefined): point is GeoPoint {
  return Boolean(
    point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180
  );
}

export function toMapLngLat(point: GeoPoint): [number, number] {
  return [point.longitude, point.latitude];
}

export function fromMapLngLat(lngLat: { lng: number; lat: number }): GeoPoint {
  return { latitude: lngLat.lat, longitude: lngLat.lng };
}

export function circlePolygon(center: GeoPoint, radiusMeters: number, steps = 64) {
  const coordinates: [number, number][] = [];
  const earthRadius = 6371000;
  const lat = (center.latitude * Math.PI) / 180;
  const lng = (center.longitude * Math.PI) / 180;
  const distance = radiusMeters / earthRadius;

  for (let i = 0; i <= steps; i += 1) {
    const bearing = (2 * Math.PI * i) / steps;
    const pointLat = Math.asin(
      Math.sin(lat) * Math.cos(distance) +
        Math.cos(lat) * Math.sin(distance) * Math.cos(bearing)
    );
    const pointLng = lng + Math.atan2(
      Math.sin(bearing) * Math.sin(distance) * Math.cos(lat),
      Math.cos(distance) - Math.sin(lat) * Math.sin(pointLat)
    );
    coordinates.push([(pointLng * 180) / Math.PI, (pointLat * 180) / Math.PI]);
  }

  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "Polygon" as const,
      coordinates: [coordinates]
    }
  };
}
