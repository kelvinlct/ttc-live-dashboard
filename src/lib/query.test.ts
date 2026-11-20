import { describe, expect, it } from "vitest";
import { parseCoordinate, parseRouteTag, parseStopPairs } from "@/lib/query";

describe("query parsing", () => {
  it("accepts route tags and rejects path tricks", () => {
    expect(parseRouteTag("504")).toBe("504");
    expect(parseRouteTag("929")).toBe("929");
    expect(parseRouteTag("../504")).toBeNull();
    expect(parseRouteTag("")).toBeNull();
  });

  it("parses multi-stop pairs and rejects a broken list", () => {
    expect(parseStopPairs("504|1389,501|2201")).toEqual([
      { routeTag: "504", stopTag: "1389" },
      { routeTag: "501", stopTag: "2201" },
    ]);
    expect(parseStopPairs("504")).toBeNull();
    expect(parseStopPairs("504|1389|extra")).toBeNull();
    expect(parseStopPairs("bad tag|1")).toBeNull();
  });

  it("keeps coordinates inside the Toronto box", () => {
    expect(parseCoordinate("43.65", 43, 44.2)).toBe(43.65);
    expect(parseCoordinate("51.5", 43, 44.2)).toBeNull();
    expect(parseCoordinate("nope", 43, 44.2)).toBeNull();
  });
});
