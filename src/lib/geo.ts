const EARTH_METRES = 6_371_000;

export type GeoPoint = { lat: number; lon: number };

export type IndexedStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Pairs of [routeTag, stopTag] that serve this public stop number. */
  routes: [string, string][];
};

export type StopIndexFile = {
  generatedAt: string;
  source: string;
  stopCount: number;
  stops: IndexedStop[];
};

export function haversineMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_METRES * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function nearestStops(
  stops: IndexedStop[],
  lat: number,
  lon: number,
  options: { limit?: number; radiusM?: number } = {},
): Array<IndexedStop & { distanceM: number }> {
  const limit = options.limit ?? 12;
  const radiusM = options.radiusM ?? 1_200;
  return stops
    .map((stop) => ({
      ...stop,
      distanceM: haversineMetres(lat, lon, stop.lat, stop.lon),
    }))
    .filter((stop) => stop.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
}

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
