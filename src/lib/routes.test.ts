import { describe, expect, it } from "vitest";
import {
  classifyRoute,
  compareRouteNumbers,
  filterRoutes,
  splitRouteTitle,
  type RouteSummary,
} from "@/lib/routes";

function route(tag: string, title: string, mode: RouteSummary["mode"]): RouteSummary {
  const { shortName, longName } = splitRouteTitle(title, tag);
  return { tag, title, shortName, longName, mode };
}

const routes: RouteSummary[] = [
  route("36", "36-Finch West", "bus"),
  route("504", "504-King", "streetcar"),
  route("501", "501-Queen", "streetcar"),
  route("929", "929-Dufferin Express", "express"),
  route("320", "320-Yonge", "night"),
];

describe("route classification", () => {
  it("splits the NextBus title", () => {
    expect(splitRouteTitle("504-King", "504")).toEqual({
      shortName: "504",
      longName: "King",
    });
  });

  it("classifies TTC number bands", () => {
    expect(classifyRoute("504")).toBe("streetcar");
    expect(classifyRoute("52")).toBe("bus");
    expect(classifyRoute("320")).toBe("night");
    expect(classifyRoute("400")).toBe("community");
    expect(classifyRoute("929")).toBe("express");
  });

  it("sorts route numbers numerically", () => {
    expect(["504", "29", "96", "7"].sort(compareRouteNumbers)).toEqual([
      "7",
      "29",
      "96",
      "504",
    ]);
  });
});

describe("filterRoutes", () => {
  it("prefers an exact route number over a name match", () => {
    expect(filterRoutes(routes, "504").map((route) => route.tag)).toEqual(["504"]);
  });

  it("matches names and ignores blank queries", () => {
    expect(filterRoutes(routes, "  ")).toEqual([]);
    expect(filterRoutes(routes, "fin").map((route) => route.tag)).toEqual(["36"]);
    expect(filterRoutes(routes, "queen").map((route) => route.shortName)).toEqual(["501"]);
  });
});
