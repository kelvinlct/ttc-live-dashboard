import { describe, expect, it } from "vitest";
import { flattenPredictions, passengerMessages } from "@/lib/predictions";
import type { StopPrediction } from "@/lib/nextbus/types";

const stop: StopPrediction = {
  routeTag: "504",
  routeTitle: "504-King",
  stopTag: "1389",
  stopTitle: "King St East At Parliament St",
  agencyTitle: "Toronto Transit Commission",
  messages: [
    { text: "TTC Information 416-393-4636 (INFO)", priority: "Normal" },
    { text: "Streetcars are turning back at Broadview.", priority: "High" },
  ],
  noPredictionsTitle: null,
  directions: [
    {
      title: "West - 504 King towards Roncesvalles",
      predictions: [
        prediction(18, "4494"),
        prediction(10, "4432"),
        prediction(10, "4432"),
      ],
    },
    {
      title: "West - 504C towards Roncesvalles",
      predictions: [prediction(22, "8376")],
    },
  ],
};

function prediction(minutes: number, vehicle: string) {
  return {
    minutes,
    seconds: minutes * 60,
    epochTime: 1_700_000_000_000,
    vehicle,
    branch: "504",
    tripTag: vehicle,
    dirTag: "west",
    isDeparture: false,
    affectedByLayover: false,
  };
}

describe("prediction display helpers", () => {
  it("hides the generic information line and keeps service notes", () => {
    expect(passengerMessages(stop.messages).map((message) => message.text)).toEqual([
      "Streetcars are turning back at Broadview.",
    ]);
  });

  it("sorts arrivals and drops a duplicated vehicle", () => {
    const next = flattenPredictions(stop, 3);
    expect(next.map((item) => item.minutes)).toEqual([10, 18, 22]);
    expect(next.map((item) => item.vehicle)).toEqual(["4432", "4494", "8376"]);
  });
});
