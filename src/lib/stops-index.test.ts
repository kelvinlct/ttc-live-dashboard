import { describe, expect, it } from "vitest";
import { getStopIndex, nearbyStops } from "@/lib/stops";

describe("stop index", () => {
  it("covers the surface network and finds a downtown stop", () => {
    const index = getStopIndex();
    expect(index.stopCount).toBeGreaterThan(5_000);
    expect(index.stops).toHaveLength(index.stopCount);
    expect(index.stops.every((stop) => stop.lat > 43 && stop.lat < 44)).toBe(true);

    const nearest = nearbyStops(43.65291, -79.36302, 1);
    expect(nearest[0]?.name).toMatch(/King/);
    expect(nearest[0]?.distanceM).toBeLessThan(50);
  });
});
