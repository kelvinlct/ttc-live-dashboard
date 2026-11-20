import type { NextRequest } from "next/server";
import { alertsForRoute } from "@/lib/alerts/parse";
import { getAlerts } from "@/lib/alerts/client";
import { jsonBadRequest, jsonError, jsonOk } from "@/lib/http";
import { parseRouteTag } from "@/lib/query";

export async function GET(request: NextRequest) {
  const routeParam = request.nextUrl.searchParams.get("route");
  const routeTag = routeParam === null ? null : parseRouteTag(routeParam);
  if (routeParam !== null && !routeTag) return jsonBadRequest("That route tag is not valid.");

  try {
    const feed = await getAlerts();
    const alerts = routeTag ? alertsForRoute(feed.alerts, routeTag) : feed.alerts;
    return jsonOk(
      {
        total: feed.total,
        lastUpdated: feed.lastUpdated,
        alerts,
        fetchedAt: new Date().toISOString(),
      },
      "public, s-maxage=60, stale-while-revalidate=120",
    );
  } catch (error) {
    return jsonError(error);
  }
}
