import { UpstreamError } from "@/lib/errors";
import { TtlCache } from "@/lib/ttl-cache";
import { parseAlerts, type AlertFeed } from "@/lib/alerts/parse";

export const ALERTS_ENDPOINT = "https://alerts.ttc.ca/api/alerts/list";
const ALERT_TTL_MS = 60_000;

async function fetchAlertsPayload(fetchImpl: typeof fetch): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchImpl(ALERTS_ENDPOINT, {
      headers: { Accept: "application/json", "User-Agent": "ttc-live-dashboard" },
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "network error";
    throw new UpstreamError(`Could not reach TTC alerts (${reason}).`);
  }
  if (!response.ok) {
    throw new UpstreamError(`TTC alerts responded with HTTP ${response.status}.`);
  }
  try {
    return await response.json();
  } catch {
    throw new UpstreamError("TTC alerts returned invalid JSON.");
  }
}

const cache = new TtlCache();

export async function getAlerts(fetchImpl: typeof fetch = fetch): Promise<AlertFeed> {
  return cache.get("alerts", ALERT_TTL_MS, async () => parseAlerts(await fetchAlertsPayload(fetchImpl)));
}
