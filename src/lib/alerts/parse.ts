import { asArray } from "@/lib/as-array";
import { FeedParseError } from "@/lib/errors";

export type ServiceAlert = {
  id: string;
  route: string;
  routeType: string;
  alertType: string;
  effect: string;
  effectDesc: string;
  severity: string;
  headerText: string;
  title: string;
  direction: string;
  causeDescription: string;
  start: string | null;
  end: string | null;
  stopStart: string;
  stopEnd: string;
  groups: string[];
  elevatorCode: string;
  escalatorCode: string;
  kind: "service" | "accessibility";
};

export type AlertFeed = {
  total: number;
  lastUpdated: string | null;
  alerts: ServiceAlert[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function openEnded(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const time = Date.parse(value);
  if (Number.isNaN(time) || time < Date.UTC(2000, 0, 1)) return null;
  return value;
}

function parseAlert(value: unknown, kind: ServiceAlert["kind"]): ServiceAlert | null {
  if (!isRecord(value)) return null;
  const headerText = str(value.headerText) || str(value.title);
  if (!headerText) return null;
  const period = isRecord(value.activePeriod) ? value.activePeriod : {};
  const groups = asArray(value.activePeriodGroup).flatMap((group) => {
    const text = str(group);
    return text ? [text] : [];
  });
  return {
    id: str(value.id),
    route: str(value.route),
    routeType: str(value.routeType),
    alertType: str(value.alertType),
    effect: str(value.effect),
    effectDesc: str(value.effectDesc),
    severity: str(value.severity) || "Info",
    headerText,
    title: str(value.title),
    direction: str(value.direction),
    causeDescription: str(value.causeDescription),
    start: openEnded(period.start),
    end: openEnded(period.end),
    stopStart: str(value.stopStart),
    stopEnd: str(value.stopEnd),
    groups,
    elevatorCode: str(value.elevatorCode),
    escalatorCode: str(value.escalatorCode),
    kind,
  };
}

export function parseAlerts(payload: unknown): AlertFeed {
  if (!isRecord(payload)) throw new FeedParseError("Alerts payload was not an object.");
  const service = asArray(payload.routes).flatMap((alert) => {
    const parsed = parseAlert(alert, "service");
    return parsed ? [parsed] : [];
  });
  const accessibility = asArray(payload.accessibility).flatMap((alert) => {
    const parsed = parseAlert(alert, "accessibility");
    return parsed ? [parsed] : [];
  });
  const alerts = [...service, ...accessibility];
  return {
    total: typeof payload.total === "number" ? payload.total : alerts.length,
    lastUpdated: str(payload.lastUpdated) || null,
    alerts,
  };
}

export function alertsForRoute(alerts: ServiceAlert[], routeTag: string): ServiceAlert[] {
  return alerts.filter((alert) => {
    if (alert.kind !== "service") return false;
    const routes = alert.route.split(",").map((part) => part.trim());
    return routes.includes(routeTag);
  });
}
