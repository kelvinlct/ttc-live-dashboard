const ROUTE_TAG = /^[A-Za-z0-9]{1,6}$/;
const STOP_TAG = /^[A-Za-z0-9_-]{1,24}$/;
const STOP_ID = /^[A-Za-z0-9]{1,10}$/;

export function parseRouteTag(value: string | null): string | null {
  if (!value || !ROUTE_TAG.test(value)) return null;
  return value;
}

export function parseStopTag(value: string | null): string | null {
  if (!value || !STOP_TAG.test(value)) return null;
  return value;
}

export function parseStopId(value: string | null): string | null {
  if (!value || !STOP_ID.test(value)) return null;
  return value;
}

export type StopPair = { routeTag: string; stopTag: string };

/** `504|1389,501|2201` — capped so one dashboard cannot fan out unbounded. */
export function parseStopPairs(value: string | null, max = 24): StopPair[] | null {
  if (!value) return null;
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0 || parts.length > max) return null;

  const pairs: StopPair[] = [];
  for (const part of parts) {
    const [routeTag, stopTag] = part.split("|");
    if (!routeTag || !stopTag || part.split("|").length !== 2) return null;
    if (!ROUTE_TAG.test(routeTag) || !STOP_TAG.test(stopTag)) return null;
    pairs.push({ routeTag, stopTag });
  }
  return pairs;
}

export function parseCoordinate(
  value: string | null,
  min: number,
  max: number,
): number | null {
  if (value === null || value.trim() === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return number;
}
