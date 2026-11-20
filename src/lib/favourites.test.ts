import { describe, expect, it } from "vitest";
import {
  FAVOURITES_KEY,
  MAX_FAVOURITES,
  parseFavourites,
  readFavourites,
  toggleFavourite,
  writeFavourites,
  type Favourite,
} from "@/lib/favourites";

function favourite(routeTag: string, stopTag: string): Favourite {
  return {
    routeTag,
    routeTitle: `${routeTag}-Test`,
    stopTag,
    stopId: stopTag,
    stopTitle: `Stop ${stopTag}`,
    directionTitle: "",
  };
}

function memoryStore(initial = "") {
  const data = new Map<string, string>(initial ? [[FAVOURITES_KEY, initial]] : []);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("favourites", () => {
  it("ignores corrupt and partial records", () => {
    expect(parseFavourites("not json")).toEqual([]);
    expect(parseFavourites(JSON.stringify({ routeTag: "504" }))).toEqual([]);
    expect(
      parseFavourites(JSON.stringify([favourite("504", "1"), { routeTag: "501" }])),
    ).toEqual([favourite("504", "1")]);
  });

  it("toggles a stop and caps the list", () => {
    const saved = toggleFavourite([], favourite("504", "1"));
    expect(saved).toHaveLength(1);
    expect(toggleFavourite(saved, favourite("504", "1"))).toEqual([]);

    let list: Favourite[] = [];
    for (let i = 0; i < MAX_FAVOURITES + 2; i += 1) {
      list = toggleFavourite(list, favourite("504", String(i)));
    }
    expect(list).toHaveLength(MAX_FAVOURITES);
    expect(list[0].stopTag).toBe(String(MAX_FAVOURITES + 1));
  });

  it("round-trips through a key-value store", () => {
    const store = memoryStore();
    writeFavourites(store, [favourite("501", "9")]);
    expect(readFavourites(store)).toEqual([favourite("501", "9")]);
  });
});
