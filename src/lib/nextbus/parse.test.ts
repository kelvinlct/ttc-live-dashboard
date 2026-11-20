import { describe, expect, it } from "vitest";
import { FeedParseError } from "@/lib/errors";
import {
  parsePredictions,
  parseRouteConfig,
  parseRouteList,
  parseVehicles,
} from "@/lib/nextbus/parse";

const routeList = {
  route: [
    { tag: "504", title: "504-King" },
    { tag: "7", title: "7-Bathurst" },
    { tag: "320", title: "320-Yonge" },
  ],
};

describe("parseRouteList", () => {
  it("classifies and sorts routes numerically", () => {
    const routes = parseRouteList(routeList);
    expect(routes.map((route) => route.tag)).toEqual(["7", "320", "504"]);
    expect(routes.find((route) => route.tag === "504")?.mode).toBe("streetcar");
    expect(routes.find((route) => route.tag === "320")?.mode).toBe("night");
  });

  it("accepts a single route object", () => {
    expect(parseRouteList({ route: { tag: "501", title: "501-Queen" } })).toHaveLength(1);
  });

  it("surfaces feed errors", () => {
    expect(() =>
      parseRouteList({ Error: { content: "Agency ttc not found" } }),
    ).toThrow(FeedParseError);
  });
});

describe("parseRouteConfig", () => {
  const payload = {
    route: {
      tag: "504",
      title: "504-King",
      color: "DA291C",
      oppositeColor: "not-a-color",
      latMin: "43.64",
      latMax: "43.68",
      lonMin: "-79.45",
      lonMax: "-79.35",
      stop: [
        {
          tag: "1389",
          stopId: "4141",
          title: "King St East At Parliament St",
          lat: "43.65291",
          lon: "-79.36302",
        },
        { tag: "bad", title: "Missing coordinates" },
      ],
      direction: {
        tag: "504_1_504A",
        title: "West - 504 King towards Dundas West Station",
        name: "West",
        branch: "504",
        useForUI: "true",
        stop: [{ tag: "1389" }, { tag: "14162" }],
      },
      path: {
        point: [
          { lat: "43.65", lon: "-79.36" },
          { lat: "43.66", lon: "-79.37" },
        ],
      },
    },
  };

  it("normalizes a single direction, colors, and paths", () => {
    const route = parseRouteConfig(payload);
    expect(route.mode).toBe("streetcar");
    expect(route.color).toBe("#da291c");
    expect(route.oppositeColor).toBeNull();
    expect(route.stops).toHaveLength(1);
    expect(route.stops[0]).toMatchObject({ tag: "1389", stopId: "4141", lat: 43.65291 });
    expect(route.directions[0].stopTags).toEqual(["1389", "14162"]);
    expect(route.paths[0]).toHaveLength(2);
  });
});

describe("parsePredictions", () => {
  it("unwraps one prediction object and an empty direction", () => {
    const parsed = parsePredictions({
      predictions: {
        routeTag: "504",
        stopTag: "1389",
        routeTitle: "504-King",
        stopTitle: "King St East At Parliament St",
        agencyTitle: "Toronto Transit Commission",
        message: { text: "Delay on King.", priority: "High" },
        direction: {
          title: "West - 504 King towards Dundas West Station",
          prediction: {
            seconds: "90",
            minutes: "1",
            epochTime: "1795170465558",
            vehicle: "4432",
            branch: "504",
            tripTag: "50960270",
            dirTag: "504_1",
            isDeparture: "false",
          },
        },
      },
    });

    expect(parsed).toHaveLength(1);
    expect(parsed[0].messages[0].text).toBe("Delay on King.");
    expect(parsed[0].directions[0].predictions[0]).toMatchObject({
      minutes: 1,
      seconds: 90,
      vehicle: "4432",
      affectedByLayover: false,
    });
  });

  it("keeps the empty-direction title when nothing is predicted", () => {
    const parsed = parsePredictions({
      predictions: {
        routeTag: "504",
        stopTag: "14162",
        routeTitle: "504-King",
        stopTitle: "Broadview Station",
        dirTitleBecauseNoPredictions: "West - 504 King towards Dundas West Station",
      },
    });
    expect(parsed[0].directions).toEqual([]);
    expect(parsed[0].noPredictionsTitle).toMatch(/Dundas West/);
  });
});

describe("parseVehicles", () => {
  it("reads a single vehicle and the feed clock", () => {
    const feed = parseVehicles({
      vehicle: {
        id: "8376",
        routeTag: "504",
        dirTag: "504_0",
        lat: "43.64718",
        lon: "-79.38715",
        heading: "74",
        speedKmHr: "2",
        predictable: "true",
        secsSinceReport: "30",
      },
      lastTime: { time: "1795169765139" },
    });
    expect(feed.lastTime).toBe(1795169765139);
    expect(feed.vehicles[0]).toMatchObject({
      id: "8376",
      heading: 74,
      speedKmHr: 2,
      predictable: true,
    });
  });
});
