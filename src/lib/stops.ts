import raw from "@/data/stops.json";
import { nearestStops, type IndexedStop, type StopIndexFile } from "@/lib/geo";

const index = raw as StopIndexFile;

export function getStopIndex(): StopIndexFile {
  return index;
}

export function nearbyStops(lat: number, lon: number, limit = 12): Array<IndexedStop & { distanceM: number }> {
  return nearestStops(index.stops, lat, lon, { limit, radiusM: 1_500 });
}
