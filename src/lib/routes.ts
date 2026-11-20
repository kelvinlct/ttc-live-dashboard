export type RouteMode = "streetcar" | "bus" | "express" | "night" | "community";

export type RouteSummary = {
  tag: string;
  title: string;
  shortName: string;
  longName: string;
  mode: RouteMode;
};

export function splitRouteTitle(
  title: string,
  tag: string,
): { shortName: string; longName: string } {
  const index = title.indexOf("-");
  if (index === -1) return { shortName: tag, longName: title };
  const shortName = title.slice(0, index).trim() || tag;
  const longName = title.slice(index + 1).trim() || title;
  return { shortName, longName };
}

export function classifyRoute(shortName: string): RouteMode {
  const number = Number(shortName);
  if (!Number.isInteger(number)) return "bus";
  if (number >= 300 && number < 400) return "night";
  if (number >= 400 && number < 500) return "community";
  if (number >= 500 && number < 600) return "streetcar";
  if (number >= 900 && number < 1000) return "express";
  return "bus";
}

export function modeAccent(mode: RouteMode): string {
  switch (mode) {
    case "streetcar":
      return "#e10600";
    case "express":
      return "#6d28d9";
    case "night":
      return "#4338ca";
    case "community":
      return "#0f766e";
    default:
      return "#1d4e89";
  }
}

export function modeLabel(mode: RouteMode): string {
  switch (mode) {
    case "streetcar":
      return "Streetcar";
    case "express":
      return "Express";
    case "night":
      return "Blue Night";
    case "community":
      return "Community";
    default:
      return "Bus";
  }
}

export function compareRouteNumbers(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}

export function filterRoutes(routes: RouteSummary[], query: string): RouteSummary[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const scored = routes.flatMap((route) => {
    const short = route.shortName.toLowerCase();
    const long = route.longName.toLowerCase();
    const title = route.title.toLowerCase();
    let score = 0;
    if (short === needle) score = 100;
    else if (short.startsWith(needle)) score = 80;
    else if (long.startsWith(needle)) score = 60;
    else if (title.includes(needle) || long.includes(needle)) score = 40;
    return score > 0 ? [{ route, score }] : [];
  });

  scored.sort(
    (a, b) =>
      b.score - a.score || compareRouteNumbers(a.route.shortName, b.route.shortName),
  );
  return scored.slice(0, 8).map((entry) => entry.route);
}

export const POPULAR_ROUTES: RouteSummary[] = [
  ["501", "Queen", "streetcar"],
  ["504", "King", "streetcar"],
  ["505", "Dundas", "streetcar"],
  ["506", "Carlton", "streetcar"],
  ["510", "Spadina", "streetcar"],
  ["512", "St Clair", "streetcar"],
  ["29", "Dufferin", "bus"],
  ["36", "Finch West", "bus"],
  ["96", "Wilson", "bus"],
  ["929", "Dufferin Express", "express"],
  ["320", "Yonge", "night"],
].map(([tag, longName, mode]) => ({
  tag,
  title: `${tag}-${longName}`,
  shortName: tag,
  longName,
  mode: mode as RouteMode,
}));
