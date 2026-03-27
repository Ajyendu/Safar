/**
 * Haversine distance in meters.
 */
export function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** True if point is within radiusMeters of center */
export function inGeofence(lat, lng, centerLat, centerLng, radiusMeters) {
  return haversineMeters(lat, lng, centerLat, centerLng) <= radiusMeters;
}

/** Find graph node id closest to GPS position */
export function nearestNodeId(nodes, lat, lng) {
  if (!nodes?.length) return null;
  let best = nodes[0].id;
  let bestD = Infinity;
  for (const n of nodes) {
    const d = haversineMeters(lat, lng, n.lat, n.lng);
    if (d < bestD) {
      bestD = d;
      best = n.id;
    }
  }
  return best;
}

/** Bearing from a to b in degrees 0–360 */
export function bearingDegrees(latA, lngA, latB, lngB) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lngB - lngA)) * Math.cos(toRad(latB));
  const x =
    Math.cos(toRad(latA)) * Math.sin(toRad(latB)) -
    Math.sin(toRad(latA)) * Math.cos(toRad(latB)) * Math.cos(toRad(lngB - lngA));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}
