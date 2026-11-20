import type { NextRequest } from "next/server";
import { jsonBadRequest, jsonOk } from "@/lib/http";
import { parseCoordinate } from "@/lib/query";
import { nearbyStops } from "@/lib/stops";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = parseCoordinate(params.get("lat"), 43, 44.2);
  const lon = parseCoordinate(params.get("lon"), -80.2, -78.8);
  if (lat === null || lon === null) {
    return jsonBadRequest("lat and lon must be coordinates in the Toronto area.");
  }

  const limit = parseCoordinate(params.get("limit"), 1, 24) ?? 12;
  return jsonOk(
    { stops: nearbyStops(lat, lon, limit), fetchedAt: new Date().toISOString() },
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
}
