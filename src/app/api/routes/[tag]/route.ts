import type { NextRequest } from "next/server";
import { jsonBadRequest, jsonError, jsonOk } from "@/lib/http";
import { getRouteConfig } from "@/lib/nextbus/client";
import { parseRouteTag } from "@/lib/query";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tag: string }> },
) {
  const { tag } = await context.params;
  const routeTag = parseRouteTag(tag);
  if (!routeTag) return jsonBadRequest("That route tag is not valid.");

  try {
    const route = await getRouteConfig(routeTag);
    return jsonOk(
      { route, fetchedAt: new Date().toISOString() },
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
  } catch (error) {
    return jsonError(error);
  }
}
