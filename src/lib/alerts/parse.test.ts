import { describe, expect, it } from "vitest";
import { alertsForRoute, parseAlerts } from "@/lib/alerts/parse";

const payload = {
  total: 2,
  lastUpdated: "2026-11-20T05:14:28.807Z",
  routes: [
    {
      id: "80509",
      route: "1",
      routeType: "Subway",
      alertType: "Planned",
      effect: "REDUCED_SERVICE",
      effectDesc: "Subway Closure - Early Closure",
      severity: "Critical",
      headerText: "Line 1: no subway service between Finch West and Wilson.",
      title: "No subway service",
      direction: "Both ways",
      causeDescription: "Planned track work",
      activePeriod: {
        start: "2026-11-19T04:59:00.000Z",
        end: "0001-01-01T00:00:00Z",
      },
      activePeriodGroup: ["Current"],
      stopStart: "Finch West",
      stopEnd: "Wilson",
    },
    {
      id: "1",
      route: "504,304",
      routeType: "Streetcar",
      headerText: "504 King is on diversion.",
      severity: "Minor",
      effectDesc: "Detour",
    },
    { id: "skip-me" },
  ],
  accessibility: [
    {
      id: "80636",
      route: "4,10,25",
      routeType: "Elevator",
      headerText: "Don Mills: Elevator 61P2L out of service.",
      effectDesc: "Out of service",
      severity: "Critical",
      elevatorCode: "61P2L",
      escalatorCode: null,
      activePeriod: { start: "2026-11-19T10:53:56.170Z", end: "0001-01-01T00:00:00Z" },
    },
  ],
};

describe("parseAlerts", () => {
  it("keeps service and accessibility alerts and drops open-ended dates", () => {
    const feed = parseAlerts(payload);
    expect(feed.total).toBe(2);
    expect(feed.alerts.map((alert) => alert.kind)).toEqual([
      "service",
      "service",
      "accessibility",
    ]);
    expect(feed.alerts[0].end).toBeNull();
    expect(feed.alerts[0].start).toBe("2026-11-19T04:59:00.000Z");
    expect(feed.alerts[2].elevatorCode).toBe("61P2L");
  });

  it("matches a route that shares an alert with others", () => {
    const feed = parseAlerts(payload);
    expect(alertsForRoute(feed.alerts, "504").map((alert) => alert.id)).toEqual(["1"]);
    expect(alertsForRoute(feed.alerts, "29")).toEqual([]);
  });
});
