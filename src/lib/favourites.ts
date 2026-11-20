export const FAVOURITES_KEY = "ttc-live-favourites-v1";
export const MAX_FAVOURITES = 12;

export type Favourite = {
  routeTag: string;
  routeTitle: string;
  stopTag: string;
  stopId: string;
  stopTitle: string;
  directionTitle: string;
};

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function isFavourite(value: unknown): value is Favourite {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const required = ["routeTag", "routeTitle", "stopTag", "stopId", "stopTitle"] as const;
  return (
    required.every((key) => typeof record[key] === "string" && record[key] !== "") &&
    typeof record.directionTitle === "string"
  );
}

export function parseFavourites(raw: string | null): Favourite[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFavourite).slice(0, MAX_FAVOURITES);
  } catch {
    return [];
  }
}

export function readFavourites(store: KeyValueStore): Favourite[] {
  return parseFavourites(store.getItem(FAVOURITES_KEY));
}

export function serializeFavourites(favourites: Favourite[]): string {
  return JSON.stringify(favourites.slice(0, MAX_FAVOURITES));
}

export function writeFavourites(store: KeyValueStore, favourites: Favourite[]): void {
  store.setItem(FAVOURITES_KEY, serializeFavourites(favourites));
}

export function favouriteKey(favourite: Pick<Favourite, "routeTag" | "stopTag">): string {
  return `${favourite.routeTag}:${favourite.stopTag}`;
}

export function isSaved(
  favourites: Favourite[],
  routeTag: string,
  stopTag: string,
): boolean {
  const key = favouriteKey({ routeTag, stopTag });
  return favourites.some((item) => favouriteKey(item) === key);
}

/** Adds a stop to the front, or removes it if it is already saved. */
export function toggleFavourite(current: Favourite[], next: Favourite): Favourite[] {
  const key = favouriteKey(next);
  if (current.some((item) => favouriteKey(item) === key)) {
    return current.filter((item) => favouriteKey(item) !== key);
  }
  return [next, ...current].slice(0, MAX_FAVOURITES);
}
