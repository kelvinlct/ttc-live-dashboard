"use client";

import Link from "next/link";
import useSWR from "swr";
import { EmptyState, ErrorState, Skeleton } from "@/components/states";
import { MAX_FAVOURITES, favouriteKey, type Favourite } from "@/lib/favourites";
import { apiFetcher, REFRESH_MS } from "@/lib/fetcher";
import { destinationOf, minuteLabel } from "@/lib/format";
import { flattenPredictions } from "@/lib/predictions";
import { classifyRoute, modeAccent } from "@/lib/routes";
import { useFavourites, useHydrated } from "@/lib/use-favourites";
import type { StopPrediction } from "@/lib/nextbus/types";

type PredictionsResponse = { predictions: StopPrediction[] };

export function FavouriteBoard() {
  const hydrated = useHydrated();
  const { favourites, toggle } = useFavourites();
  const key =
    favourites.length > 0
      ? `/api/predictions?stops=${favourites
          .map((favourite) => `${favourite.routeTag}|${favourite.stopTag}`)
          .join(",")}`
      : null;
  const { data, error, isLoading, isValidating, mutate } = useSWR<PredictionsResponse>(
    key,
    apiFetcher,
    { refreshInterval: REFRESH_MS.predictions },
  );

  if (!hydrated) {
    return (
      <section aria-busy="true" aria-label="Saved stops">
        <Skeleton className="h-40" />
      </section>
    );
  }

  return (
    <section aria-labelledby="board-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="board-heading" className="font-display text-4xl font-semibold">
            Your board
          </h2>
          <p className="text-sm text-muted">
            {favourites.length === 0
              ? `Save up to ${MAX_FAVOURITES} stops. They stay in this browser.`
              : `${favourites.length} saved · refreshes every 20 seconds`}
            {isValidating && favourites.length > 0 ? " · refreshing" : ""}
          </p>
        </div>
      </div>

      {favourites.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          message="Open a route, pick the stop you actually wait at, and pin it. Next time you open this page the minutes are already here."
        />
      ) : null}

      {error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Predictions did not load."}
          onRetry={() => void mutate()}
        />
      ) : null}

      {isLoading && favourites.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      ) : null}

      {favourites.length > 0 && data ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {favourites.map((favourite) => {
            const prediction = data.predictions.find(
              (item) => item.routeTag === favourite.routeTag && item.stopTag === favourite.stopTag,
            );
            return (
              <li key={favouriteKey(favourite)}>
                <FavouriteCard
                  favourite={favourite}
                  prediction={prediction}
                  onRemove={() => toggle(favourite)}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function FavouriteCard({
  favourite,
  prediction,
  onRemove,
}: {
  favourite: Favourite;
  prediction: StopPrediction | undefined;
  onRemove: () => void;
}) {
  const arrivals = prediction ? flattenPredictions(prediction, 3) : [];
  const accent = modeAccent(classifyRoute(favourite.routeTag));
  const href = `/routes/${favourite.routeTag}/stops/${favourite.stopTag}`;

  return (
    <article className="card flex h-full flex-col p-4" style={{ borderTop: `4px solid ${accent}` }}>
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="min-w-0 rounded-md">
          <p className="font-display text-3xl leading-none font-semibold">
            <span style={{ color: accent }}>{favourite.routeTag}</span>{" "}
            <span className="text-xl">{favourite.routeTitle.replace(/^\d+-/, "")}</span>
          </p>
          <h3 className="mt-2 text-base leading-snug font-semibold">{favourite.stopTitle}</h3>
        </Link>
        <button
          type="button"
          className="btn btn-quiet shrink-0 px-3"
          onClick={onRemove}
          aria-label={`Remove ${favourite.stopTitle} on route ${favourite.routeTag} from the board`}
        >
          Remove
        </button>
      </div>
      {arrivals.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {prediction?.noPredictionsTitle
            ? `No vehicles predicted · ${destinationOf(prediction.noPredictionsTitle)}`
            : "No vehicles predicted right now."}
        </p>
      ) : (
        <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Next arrivals">
          {arrivals.map((arrival) => (
            <li key={`${arrival.vehicle}-${arrival.minutes}-${arrival.dirTag}`}>
              <Link href={href} className="block rounded-xl bg-paper px-2 py-2">
                <span className="font-display block text-4xl leading-none font-semibold">
                  {arrival.minutes <= 0 ? "Due" : arrival.minutes}
                </span>
                <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {minuteLabel(arrival.minutes) === "Due" ? "now" : "min"}
                </span>
                <span className="mt-1 block truncate text-xs text-muted">
                  {destinationOf(arrival.direction)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
