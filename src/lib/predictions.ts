import type { FeedMessage, Prediction, StopPrediction } from "@/lib/nextbus/types";

export type FlatPrediction = Prediction & { direction: string };

const BOILERPLATE = /ttc information\s+\d/i;

export function passengerMessages(messages: FeedMessage[]): FeedMessage[] {
  return messages.filter((message) => !BOILERPLATE.test(message.text));
}

export function flattenPredictions(stop: StopPrediction, limit = 3): FlatPrediction[] {
  const sorted = stop.directions
    .flatMap((group) =>
      group.predictions.map((prediction) => ({ ...prediction, direction: group.title })),
    )
    .sort((a, b) => a.seconds - b.seconds);

  const seen = new Set<string>();
  const unique: FlatPrediction[] = [];
  for (const prediction of sorted) {
    const key = `${prediction.dirTag}|${prediction.vehicle}|${prediction.minutes}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(prediction);
    if (unique.length >= limit) break;
  }
  return unique;
}
