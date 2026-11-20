"use client";

import Link from "next/link";
import useSWR from "swr";
import { ErrorState, Skeleton } from "@/components/states";
import { MAX_FAVOURITES, isSaved } from "@/lib/favourites";
import { apiFetcher, REFRESH_MS } from "@/lib/fetcher";
import { destinationOf, minuteLabel } from "@/lib/format";
import { passengerMessages } from "@/lib/predictions";
import { classifyRoute, modeAccent, modeLabel } from "@/lib/routes";
import { useFavourites, useHydrated } from "@/lib/use-favourites";
import type { RouteConfig, StopPrediction } from "@/lib/nextbus/types";

type PredictionsResponse = { predictions: StopPrediction[] };
type RouteResponse = { route: RouteConfig };

export function StopBoard({ routeTag, stopTag }: { routeTag: string; stopTag: string }) {
  const hydrated = useHydrated();
  const { favourites, toggle } = useFavourites();
  const routeQuery = useSWR<RouteResponse>(`/api/routes/${encodeURIComponent(routeTag)}`, apiFetcher, {
    revalidateOnFocus: false,
  });
  const { data, error, isLoading, isValidating, mutate } = useSWR<PredictionsResponse>(
    `/api/predictions?route=${encodeURIComponent(routeTag)}&stop=${encodeURIComponent(stopTag)}`,
    apiFetcher,
    { refreshInterval: REFRESH_MS.predictions },
  );

  if (isLoading || !hydrated) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Predictions did not load."}
        onRetry={() => void mutate()}
      />
    );
  }

  const prediction =
    data.predictions.find((item) => item.routeTag === routeTag && item.stopTag === stopTag) ??
    data.predictions[0];

  if (!prediction) {
    return (
      <ErrorState
        title="No prediction data"
        message="The feed did not return this stop. It may have been removed from the route."
        onRetry={() => void mutate()}
      />
    );
  }

  const saved = isSaved(favourites, routeTag, stopTag);
  const accent = modeAccent(classifyRoute(routeTag));
  const stopRecord = routeQuery.data?.route.stops.find((stop) => stop.tag === stopTag);
  const messages = passengerMessages(prediction.messages);
  const soonest = prediction.directions
    .flatMap((group) => group.predictions.map((item) => ({ ...item, direction: group.title })))
    .sort((a, b) => a.seconds - b.seconds)[0];
  const summary = soonest
    ? `Next vehicle ${minuteLabel(soonest.minutes)} towards ${destinationOf(soonest.direction)}.`
    : "No vehicles are predicted at this stop right now.";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm font-semibold">
        <Link href={`/routes/${routeTag}`} className="underline">
          ← Route {routeTag}
        </Link>
      </p>
      <header className="card p-5">
        <p className="text-sm font-semibold tracking-[0.16em] uppercase" style={{ color: accent }}>
          {modeLabel(classifyRoute(routeTag))} {routeTag}
        </p>
        <h1 className="mt-1 font-display text-5xl leading-none font-semibold">{prediction.stopTitle}</h1>
        <p className="mt-2 text-sm text-muted">
          {stopRecord ? `Stop ${stopRecord.stopId} · ` : ""}
          {prediction.routeTitle}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn"
            aria-pressed={saved}
            onClick={() =>
              toggle({
                routeTag,
                routeTitle: prediction.routeTitle,
                stopTag,
                stopId: stopRecord?.stopId || stopTag,
                stopTitle: stopRecord?.title || prediction.stopTitle,
                directionTitle: soonest?.direction ?? prediction.noPredictionsTitle ?? "",
              })
            }
          >
            {saved ? "Saved to board" : "Save to board"}
          </button>
          <Link href={`/routes/${routeTag}/map`} className="btn btn-quiet">
            Vehicles on the map
          </Link>
          {!saved && favourites.length >= MAX_FAVOURITES ? (
            <p className="text-sm text-muted">Saving another stop drops the oldest of {MAX_FAVOURITES}.</p>
          ) : null}
        </div>
      </header>

      <p className="sr-only" aria-live="polite">
        {summary}
      </p>

      {messages.map((message) => (
        <p key={message.text} className="card border-l-4 border-l-due px-4 py-3 text-sm" role="status">
          {message.text}
        </p>
      ))}

      {prediction.directions.length === 0 ? (
        <div className="card p-6">
          <h2 className="font-display text-4xl font-semibold">No vehicles predicted</h2>
          <p className="mt-2 text-muted">
            {prediction.noPredictionsTitle
              ? destinationOf(prediction.noPredictionsTitle)
              : "Service may be finished, or this branch is not running."}
          </p>
        </div>
      ) : (
        prediction.directions.map((group) => (
          <section key={group.title} aria-labelledby={slug(group.title)} className="flex flex-col gap-3">
            <h2 id={slug(group.title)} className="font-display text-3xl font-semibold">
              {group.title}
            </h2>
            <ol className="flex flex-col gap-3">
              {group.predictions.map((item, index) => (
                <li key={`${item.vehicle}-${item.epochTime}-${index}`} className="card flex items-center gap-4 p-4">
                  <p className="w-24 shrink-0">
                    <span
                      className={`font-display block text-5xl leading-none font-semibold ${
                        item.minutes <= 0 ? "text-due" : item.minutes <= 5 ? "text-soon" : ""
                      }`}
                    >
                      {item.minutes <= 0 ? "Due" : item.minutes}
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-muted uppercase">
                      {item.minutes <= 0 ? "now" : item.minutes === 1 ? "minute" : "minutes"}
                    </span>
                  </p>
                  <div>
                    <p className="font-semibold">{destinationOf(group.title)}</p>
                    <p className="text-sm text-muted">
                      {item.branch ? `Branch ${item.branch} · ` : ""}
                      Vehicle {item.vehicle || "unknown"}
                      {item.isDeparture ? " · departs" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}

      <p className="text-sm text-muted">
        {isValidating ? "Refreshing predictions…" : "Predictions refresh every 20 seconds."}
      </p>
    </div>
  );
}

function slug(value: string): string {
  return `dir-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
