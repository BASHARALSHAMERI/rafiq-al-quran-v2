export type BrowserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export function haversineMeters(input: {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}) {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dLat = rad(input.toLat - input.fromLat);
  const dLng = rad(input.toLng - input.fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(input.fromLat)) *
      Math.cos(rad(input.toLat)) *
      Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function geolocationUnavailableMessage(ar: boolean) {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return ar
      ? "\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 \u064a\u062a\u0637\u0644\u0628 HTTPS \u0623\u0648 localhost \u0644\u0643\u064a \u064a\u0633\u0645\u062d \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 GPS."
      : "Location requires HTTPS or localhost so the browser can allow GPS access.";
  }

  return ar
    ? "\u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0644\u0627 \u064a\u062f\u0639\u0645 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u062c\u063a\u0631\u0627\u0641\u064a."
    : "Geolocation is not supported by this browser.";
}

export function geolocationErrorMessage(error: GeolocationPositionError | null, ar: boolean) {
  if (!error) return geolocationUnavailableMessage(ar);

  if (error.code === error.PERMISSION_DENIED) {
    return ar
      ? "\u062a\u0645 \u0631\u0641\u0636 \u0625\u0630\u0646 \u0627\u0644\u0645\u0648\u0642\u0639. \u0627\u0633\u0645\u062d \u0628\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 GPS \u0645\u0646 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u062b\u0645 \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649."
      : "Location permission was denied. Allow GPS access in the browser settings and try again.";
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return ar
      ? "\u062a\u0639\u0630\u0631\u062a \u0642\u0631\u0627\u0621\u0629 \u0645\u0648\u0642\u0639 \u0627\u0644\u062c\u0647\u0627\u0632. \u062a\u0623\u0643\u062f \u0645\u0646 \u062a\u0641\u0639\u064a\u0644 GPS \u0623\u0648 \u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u0648\u0642\u0639."
      : "Unable to read device location. Make sure GPS or location services are enabled.";
  }

  if (error.code === error.TIMEOUT) {
    return ar
      ? "\u0627\u0646\u062a\u0647\u062a \u0645\u0647\u0644\u0629 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639. \u0627\u0646\u062a\u0642\u0644 \u0625\u0644\u0649 \u0645\u0643\u0627\u0646 \u0628\u0625\u0634\u0627\u0631\u0629 \u0623\u0641\u0636\u0644 \u062b\u0645 \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649."
      : "Location timed out. Move to a place with a better signal and try again.";
  }

  return ar
    ? "\u062a\u0639\u0630\u0631 \u0627\u0644\u062d\u0635\u0648\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0642\u0639."
    : "Unable to retrieve location.";
}

export function requestBrowserLocation(ar: boolean): Promise<BrowserLocation> {
  if (!navigator.geolocation) {
    return Promise.reject(new Error(geolocationUnavailableMessage(ar)));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null,
        });
      },
      (error) => reject(new Error(geolocationErrorMessage(error, ar))),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}
