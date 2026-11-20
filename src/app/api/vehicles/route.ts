import type { NextRequest } from "next/server";
import { jsonBadRequest, jsonError, jsonOk } from "@/lib/http";
import { getVehicles } from "@/lib/nextbus/client";
import { parseRouteTag } from "@/lib/query";

export async function GET(request: NextRequest) {
  const routeTag = parseRouteTag(request.nextUrl.searchParams.get("route"));
  if (!routeTag) return jsonBadRequest("A valid route tag is required.");

  try {
    const feed = await getVehicles(routeTag);
    return jsonOk(
      { ...feed, fetchedAt: new Date().toISOString() },
      "public, s-maxage=8, stale-while-revalidate=15",
    );
  } catch (error) {
    return jsonError(error);
  }
}
