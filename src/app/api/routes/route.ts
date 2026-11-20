import { jsonError, jsonOk } from "@/lib/http";
import { getRouteList } from "@/lib/nextbus/client";

export async function GET() {
  try {
    const routes = await getRouteList();
    return jsonOk(
      { routes, fetchedAt: new Date().toISOString() },
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
  } catch (error) {
    return jsonError(error);
  }
}
