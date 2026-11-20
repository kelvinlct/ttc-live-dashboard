"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  FAVOURITES_KEY,
  parseFavourites,
  serializeFavourites,
  toggleFavourite,
  type Favourite,
} from "@/lib/favourites";

const CHANGE = "ttc-favourites";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE, onStoreChange);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(FAVOURITES_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribeHydration() {
  return () => {};
}

export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, () => true, () => false);
}

export function useFavourites() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const favourites = useMemo(() => parseFavourites(raw || null), [raw]);

  const replace = useCallback((next: Favourite[]) => {
    try {
      localStorage.setItem(FAVOURITES_KEY, serializeFavourites(next));
      window.dispatchEvent(new Event(CHANGE));
    } catch {
      // Private mode can block storage. The board still works for this visit.
    }
  }, []);

  const toggle = useCallback(
    (favourite: Favourite) => {
      replace(toggleFavourite(favourites, favourite));
    },
    [favourites, replace],
  );

  return { favourites, toggle };
}
