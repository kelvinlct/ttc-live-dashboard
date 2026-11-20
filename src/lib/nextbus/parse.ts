import { asArray } from "@/lib/as-array";
import { FeedParseError } from "@/lib/errors";
import type { GeoPoint } from "@/lib/geo";
import { classifyRoute, compareRouteNumbers, splitRouteTitle } from "@/lib/routes";
import type {
  Direction,
  FeedMessage,
  Prediction,
  PredictionGroup,
  RouteConfig,
  RouteSummary,
  Stop,
  StopPrediction,
  Vehicle,
  VehicleFeed,
} from "@/lib/nextbus/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function hexColor(value: unknown): string | null {
  const raw = str(value).replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return null;
  return `#${raw.toLowerCase()}`;
}

export function readFeedError(payload: unknown): string | null {
  if (!isRecord(payload) || !("Error" in payload)) return null;
  const error = payload.Error;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (isRecord(error)) {
    const content = str(error.content).trim();
    if (content) return content;
  }
  return "The transit feed returned an error.";
}

function assertNoFeedError(payload: unknown): void {
  const message = readFeedError(payload);
  if (message) throw new FeedParseError(message);
}

export function parseRouteList(payload: unknown): RouteSummary[] {
  assertNoFeedError(payload);
  if (!isRecord(payload)) throw new FeedParseError("Route list was not an object.");

  const routes = asArray(payload.route).flatMap((route) => {
    if (!isRecord(route)) return [];
    const tag = str(route.tag).trim();
    const title = str(route.title).trim();
    if (!tag || !title) return [];
    const { shortName, longName } = splitRouteTitle(title, tag);
    return [
      {
        tag,
        title,
        shortName,
        longName,
        mode: classifyRoute(shortName),
      } satisfies RouteSummary,
    ];
  });

  routes.sort((a, b) => compareRouteNumbers(a.shortName, b.shortName));
  return routes;
}

function parseStop(value: unknown): Stop | null {
  if (!isRecord(value)) return null;
  const tag = str(value.tag).trim();
  const title = str(value.title).trim();
  const lat = num(value.lat);
  const lon = num(value.lon);
  if (!tag || !title || lat === null || lon === null) return null;
  return { tag, stopId: str(value.stopId).trim(), title, lat, lon };
}

function parseDirection(value: unknown): Direction | null {
  if (!isRecord(value)) return null;
  const tag = str(value.tag).trim();
  const title = str(value.title).trim();
  if (!tag || !title) return null;
  const stopTags = asArray(value.stop).flatMap((stop) => {
    if (!isRecord(stop)) return [];
    const stopTag = str(stop.tag).trim();
    return stopTag ? [stopTag] : [];
  });
  return {
    tag,
    title,
    name: str(value.name).trim(),
    branch: str(value.branch).trim(),
    useForUI: str(value.useForUI) !== "false",
    stopTags,
  };
}

function parsePath(value: unknown): GeoPoint[] {
  if (!isRecord(value)) return [];
  return asArray(value.point).flatMap((point) => {
    if (!isRecord(point)) return [];
    const lat = num(point.lat);
    const lon = num(point.lon);
    return lat === null || lon === null ? [] : [{ lat, lon }];
  });
}

export function parseRouteConfig(payload: unknown): RouteConfig {
  assertNoFeedError(payload);
  if (!isRecord(payload) || !isRecord(payload.route)) {
    throw new FeedParseError("Route configuration was missing.");
  }
  const route = payload.route;
  const tag = str(route.tag).trim();
  const title = str(route.title).trim();
  if (!tag || !title) throw new FeedParseError("Route configuration is missing a tag or title.");

  const { shortName, longName } = splitRouteTitle(title, tag);
  const directions = asArray(route.direction)
    .map(parseDirection)
    .filter((direction): direction is Direction => direction !== null)
    .sort((a, b) => Number(b.useForUI) - Number(a.useForUI) || a.title.localeCompare(b.title));

  return {
    tag,
    title,
    shortName,
    longName,
    mode: classifyRoute(shortName),
    color: hexColor(route.color),
    oppositeColor: hexColor(route.oppositeColor),
    latMin: num(route.latMin),
    latMax: num(route.latMax),
    lonMin: num(route.lonMin),
    lonMax: num(route.lonMax),
    stops: asArray(route.stop).flatMap((stop) => {
      const parsed = parseStop(stop);
      return parsed ? [parsed] : [];
    }),
    directions,
    paths: asArray(route.path)
      .map(parsePath)
      .filter((path) => path.length > 1),
  };
}

function parsePrediction(value: unknown): Prediction | null {
  if (!isRecord(value)) return null;
  const minutes = num(value.minutes);
  const seconds = num(value.seconds);
  const epochTime = num(value.epochTime);
  if (minutes === null || seconds === null || epochTime === null) return null;
  return {
    minutes: Math.max(0, Math.round(minutes)),
    seconds: Math.max(0, Math.round(seconds)),
    epochTime,
    vehicle: str(value.vehicle),
    branch: str(value.branch),
    tripTag: str(value.tripTag),
    dirTag: str(value.dirTag),
    isDeparture: str(value.isDeparture) === "true",
    affectedByLayover: str(value.affectedByLayover) === "true",
  };
}

function parseGroup(value: unknown): PredictionGroup | null {
  if (!isRecord(value)) return null;
  const title = str(value.title).trim();
  const predictions = asArray(value.prediction)
    .map(parsePrediction)
    .filter((prediction): prediction is Prediction => prediction !== null)
    .sort((a, b) => a.seconds - b.seconds);
  if (!title && predictions.length === 0) return null;
  return { title, predictions };
}

function parseMessages(value: unknown): FeedMessage[] {
  return asArray(value).flatMap((message) => {
    if (!isRecord(message)) return [];
    const text = str(message.text).trim();
    if (!text) return [];
    return [{ text, priority: str(message.priority) || "Normal" }];
  });
}

export function parsePredictions(payload: unknown): StopPrediction[] {
  assertNoFeedError(payload);
  if (!isRecord(payload)) throw new FeedParseError("Predictions were not an object.");
  if (payload.predictions == null) return [];

  return asArray(payload.predictions).flatMap((item) => {
    if (!isRecord(item)) return [];
    const noPredictionsTitle = str(item.dirTitleBecauseNoPredictions).trim() || null;
    return [
      {
        routeTag: str(item.routeTag),
        routeTitle: str(item.routeTitle),
        stopTag: str(item.stopTag),
        stopTitle: str(item.stopTitle),
        agencyTitle: str(item.agencyTitle),
        messages: parseMessages(item.message),
        directions: asArray(item.direction)
          .map(parseGroup)
          .filter((group): group is PredictionGroup => group !== null),
        noPredictionsTitle,
      } satisfies StopPrediction,
    ];
  });
}

function parseVehicle(value: unknown): Vehicle | null {
  if (!isRecord(value)) return null;
  const lat = num(value.lat);
  const lon = num(value.lon);
  const id = str(value.id).trim();
  if (!id || lat === null || lon === null) return null;
  return {
    id,
    routeTag: str(value.routeTag),
    dirTag: str(value.dirTag),
    lat,
    lon,
    heading: num(value.heading) ?? 0,
    speedKmHr: num(value.speedKmHr) ?? 0,
    predictable: str(value.predictable) !== "false",
    secsSinceReport: Math.max(0, Math.round(num(value.secsSinceReport) ?? 0)),
  };
}

export function parseVehicles(payload: unknown): VehicleFeed {
  assertNoFeedError(payload);
  if (!isRecord(payload)) throw new FeedParseError("Vehicle feed was not an object.");
  const lastTime = isRecord(payload.lastTime) ? (num(payload.lastTime.time) ?? 0) : 0;
  return {
    vehicles: asArray(payload.vehicle).flatMap((vehicle) => {
      const parsed = parseVehicle(vehicle);
      return parsed ? [parsed] : [];
    }),
    lastTime,
  };
}
