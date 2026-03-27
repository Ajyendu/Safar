import { useEffect, useMemo, useState } from "react";

/**
 * Continuous GPS updates via watchPosition.
 * When `active` is false, the watch is cleared (e.g. while fake location mode is on).
 *
 * @param {boolean} active
 */
export function useGeolocation(active) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState("prompt");

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !navigator.geolocation) {
      return undefined;
    }

    const onSuccess = (pos) => {
      setError(null);
      setPosition({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        ts: pos.timestamp,
      });
    };

    const onError = (err) => {
      setError(err.message || "Location error");
    };

    const id = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 15000,
    });

    setPermission("granted");

    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, [active]);

  return { position, error, permission };
}

/**
 * Uses simulated coordinates when `fake.enabled` is true; otherwise real GPS.
 * Real `navigator.geolocation` is not subscribed while fake mode is active.
 *
 * @param {ReturnType<typeof import('./useFakeLocation.js').useFakeLocation>} fake
 */
export function useMergedLocation(fake) {
  const real = useGeolocation(!fake.enabled);

  return useMemo(() => {
    if (fake.enabled) {
      return {
        position: fake.position,
        error: null,
        permission: "granted",
        source: "fake",
      };
    }
    return {
      position: real.position,
      error: real.error,
      permission: real.permission,
      source: "gps",
    };
  }, [
    fake.enabled,
    fake.position,
    real.position,
    real.error,
    real.permission,
  ]);
}
