import { describe, expect, it } from "vitest";
import { formatDistance, haversineMetres, nearestStops, type IndexedStop } from "@/lib/geo";

const stops: IndexedStop[] = [
  {
    id: "1",
    name: "King at Parliament",
    lat: 43.65291,
    lon: -79.36302,
    routes: [["504", "1389"]],
  },
  {
    id: "2",
    name: "Union Station",
    lat: 43.6453,
    lon: -79.3805,
    routes: [["509", "1"]],
  },
  {
    id: "3",
    name: "Finch Station",
    lat: 43.7808,
    lon: -79.4156,
    routes: [["36", "9"]],
  },
];

describe("haversineMetres", () => {
  it("is zero for the same point and about a kilometre for a short walk", () => {
    expect(haversineMetres(43.65, -79.38, 43.65, -79.38)).toBe(0);
    const metres = haversineMetres(43.65291, -79.36302, 43.6453, -79.3805);
    expect(metres).toBeGreaterThan(1_400);
    expect(metres).toBeLessThan(2_000);
  });
});

describe("nearestStops", () => {
  it("returns stops inside the radius, closest first", () => {
    const found = nearestStops(stops, 43.653, -79.363, { radiusM: 2_000, limit: 5 });
    expect(found.map((stop) => stop.id)).toEqual(["1", "2"]);
    expect(found[0].distanceM).toBeLessThan(found[1].distanceM);
  });

  it("respects the limit", () => {
    const found = nearestStops(stops, 43.653, -79.363, { radiusM: 50_000, limit: 1 });
    expect(found).toHaveLength(1);
  });
});

describe("formatDistance", () => {
  it("uses metres under a kilometre and one decimal after", () => {
    expect(formatDistance(842)).toBe("842 m");
    expect(formatDistance(1_600)).toBe("1.6 km");
  });
});
