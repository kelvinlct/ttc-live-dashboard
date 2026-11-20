import type { NextRequest } from "next/server";
import { jsonBadRequest, jsonError, jsonOk } from "@/lib/http";
import { getPredictions } from "@/lib/nextbus/client";
import { parseRouteTag, parseStopId, parseStopPairs, parseStopTag } from "@/lib/query";

const CACHE = "public, s-maxage=10, stale-while-revalidate=20";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const stops = params.get("stops");
  const stopIdParam = params.get("stopId");
  const routeParam = params.get("route");
  const stopParam = params.get("stop");

  try {
    if (stops !== null) {
      const pairs = parseStopPairs(stops);
      if (!pairs) {
        return jsonBadRequest("stops must be a comma-separated list of route|stop pairs.");
      }
      const predictions = await getPredictions({ pairs });
      return jsonOk({ predictions, fetchedAt: new Date().toISOString() }, CACHE);
    }

    if (stopIdParam !== null) {
      const stopId = parseStopId(stopIdParam);
      if (!stopId) return jsonBadRequest("stopId is not a valid stop number.");
      const predictions = await getPredictions({ stopId });
      return jsonOk({ predictions, fetchedAt: new Date().toISOString() }, CACHE);
    }

    const routeTag = parseRouteTag(routeParam);
    const stopTag = parseStopTag(stopParam);
    if (!routeTag || !stopTag) {
      return jsonBadRequest("Provide route and stop, a stopId, or a stops list.");
    }
    const predictions = await getPredictions({ routeTag, stopTag });
    return jsonOk({ predictions, fetchedAt: new Date().toISOString() }, CACHE);
  } catch (error) {
    return jsonError(error);
  }
}
