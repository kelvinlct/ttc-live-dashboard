import { UpstreamError } from "@/lib/errors";
import { TtlCache } from "@/lib/ttl-cache";
import {
  parsePredictions,
  parseRouteConfig,
  parseRouteList,
  parseVehicles,
} from "@/lib/nextbus/parse";
import type { RouteConfig, RouteSummary, StopPrediction, VehicleFeed } from "@/lib/nextbus/types";
import type { StopPair } from "@/lib/query";

export const NEXTBUS_ENDPOINT = "https://retro.umoiq.com/service/publicJSONFeed";
export const AGENCY = "ttc";

const ROUTE_TTL_MS = 6 * 60 * 60 * 1000;
const PREDICTION_TTL_MS = 15_000;
const VEHICLE_TTL_MS = 10_000;

export type FeedQuery = Record<string, string | string[] | undefined>;

export function buildFeedUrl(query: FeedQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.set(key, value);
    }
  }
  return `${NEXTBUS_ENDPOINT}?${params.toString()}`;
}

export async function fetchFeed(
  query: FeedQuery,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(buildFeedUrl(query), {
      headers: {
        Accept: "application/json",
        "User-Agent": "ttc-live-dashboard",
      },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "network error";
    throw new UpstreamError(`Could not reach the TTC feed (${reason}).`);
  }

  if (!response.ok) {
    throw new UpstreamError(`The TTC feed responded with HTTP ${response.status}.`, 502);
  }

  try {
    return await response.json();
  } catch {
    throw new UpstreamError("The TTC feed returned invalid JSON.");
  }
}

export type FeedClient = {
  cache: TtlCache;
  fetchFeed(query: FeedQuery): Promise<unknown>;
};

export function createFeedClient(fetchImpl: typeof fetch = fetch): FeedClient {
  return {
    cache: new TtlCache(),
    fetchFeed: (query) => fetchFeed(query, fetchImpl),
  };
}

const defaultClient = createFeedClient();

export async function getRouteList(client: FeedClient = defaultClient): Promise<RouteSummary[]> {
  return client.cache.get("routes", ROUTE_TTL_MS, async () => {
    const payload = await client.fetchFeed({ command: "routeList", a: AGENCY });
    return parseRouteList(payload);
  });
}

export async function getRouteConfig(
  tag: string,
  client: FeedClient = defaultClient,
): Promise<RouteConfig> {
  return client.cache.get(`route:${tag}`, ROUTE_TTL_MS, async () => {
    const payload = await client.fetchFeed({ command: "routeConfig", a: AGENCY, r: tag });
    return parseRouteConfig(payload);
  });
}

export async function getPredictions(
  query: { pairs?: StopPair[]; stopId?: string; routeTag?: string; stopTag?: string },
  client: FeedClient = defaultClient,
): Promise<StopPrediction[]> {
  const key = `pred:${JSON.stringify(query)}`;
  return client.cache.get(key, PREDICTION_TTL_MS, async () => {
    if (query.pairs && query.pairs.length > 0) {
      const payload = await client.fetchFeed({
        command: "predictionsForMultiStops",
        a: AGENCY,
        stops: query.pairs.map((pair) => `${pair.routeTag}|${pair.stopTag}`),
      });
      return parsePredictions(payload);
    }
    if (query.stopId) {
      const payload = await client.fetchFeed({
        command: "predictions",
        a: AGENCY,
        stopId: query.stopId,
      });
      return parsePredictions(payload);
    }
    const payload = await client.fetchFeed({
      command: "predictions",
      a: AGENCY,
      r: query.routeTag ?? "",
      s: query.stopTag ?? "",
    });
    return parsePredictions(payload);
  });
}

export async function getVehicles(
  routeTag: string,
  client: FeedClient = defaultClient,
): Promise<VehicleFeed> {
  return client.cache.get(`veh:${routeTag}`, VEHICLE_TTL_MS, async () => {
    const payload = await client.fetchFeed({
      command: "vehicleLocations",
      a: AGENCY,
      r: routeTag,
      t: "0",
    });
    return parseVehicles(payload);
  });
}
