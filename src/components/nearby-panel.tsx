"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { ErrorState } from "@/components/states";
import { apiFetcher, REFRESH_MS } from "@/lib/fetcher";
import { formatDistance } from "@/lib/geo";
import { minuteLabel } from "@/lib/format";
import { flattenPredictions } from "@/lib/predictions";
import type { IndexedStop } from "@/lib/geo";
import type { StopPrediction } from "@/lib/nextbus/types";

type NearbyResponse = { stops: Array<IndexedStop & { distanceM: number }> };
type PredictionsResponse = { predictions: StopPrediction[] };

export function NearbyPanel() {
  const [point, setPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

  function locate() {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("This browser cannot share your location. Search for a route instead.");
      return;
    }
    setStatus("locating");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPoint({ lat: position.coords.latitude, lon: position.coords.longitude });
        setStatus("ready");
      },
      (error) => {
        setStatus("error");
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. You can still search for a route from the board."
            : "Could not read your location. Try again in a moment.",
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  const nearby = useSWR<NearbyResponse>(
    point ? `/api/nearby?lat=${point.lat}&lon=${point.lon}` : null,
    apiFetcher,
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-5xl font-semibold">Stops near you</h1>
        <p className="mt-2 max-w-prose text-muted">
          Uses this browser’s location to find surface stops within 1.5 km. Nothing is sent until you ask.
        </p>
        <button type="button" className="btn btn-ttc mt-4" onClick={locate}>
          {status === "locating" ? "Finding you…" : point ? "Update location" : "Use my location"}
        </button>
      </header>

      {status === "error" ? <ErrorState title="Location unavailable" message={message} onRetry={locate} /> : null}
      {nearby.error ? (
        <ErrorState
          message={nearby.error instanceof Error ? nearby.error.message : "Nearby stops did not load."}
          onRetry={() => void nearby.mutate()}
        />
      ) : null}

      {status === "ready" && nearby.data && nearby.data.stops.length === 0 ? (
        <p className="card p-5 text-muted">No TTC stops within 1.5 km of that point.</p>
      ) : null}

      {nearby.data && nearby.data.stops.length > 0 ? (
        <ol className="flex flex-col gap-3">
          {nearby.data.stops.map((stop) => (
            <li key={stop.id} className="card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold">{stop.name}</h2>
                <p className="shrink-0 text-sm font-semibold text-muted">{formatDistance(stop.distanceM)}</p>
              </div>
              <p className="text-sm text-muted">Stop {stop.id}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {stop.routes.map(([routeTag, stopTag]) => (
                  <li key={`${routeTag}-${stopTag}`}>
                    <Link href={`/routes/${routeTag}/stops/${stopTag}`} className="btn btn-quiet px-3">
                      {routeTag}
                    </Link>
                  </li>
                ))}
              </ul>
              <NearbyArrivals stopId={stop.id} />
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function NearbyArrivals({ stopId }: { stopId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <details
      className="mt-3"
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer text-sm font-semibold">Next arrivals</summary>
      {open ? <StopPreview stopId={stopId} /> : null}
    </details>
  );
}

function StopPreview({ stopId }: { stopId: string }) {
  const { data, error, isLoading } = useSWR<PredictionsResponse>(
    `/api/predictions?stopId=${encodeURIComponent(stopId)}`,
    apiFetcher,
    { refreshInterval: REFRESH_MS.predictions },
  );

  if (isLoading) return <p className="mt-2 text-sm text-muted">Loading predictions…</p>;
  if (error) return <p className="mt-2 text-sm text-muted">{error.message}</p>;
  if (!data || data.predictions.length === 0) {
    return <p className="mt-2 text-sm text-muted">No predictions for this stop.</p>;
  }

  return (
    <ul className="mt-2 flex flex-col gap-2">
      {data.predictions.map((prediction) => {
        const next = flattenPredictions(prediction, 2);
        return (
          <li key={`${prediction.routeTag}-${prediction.stopTag}`} className="text-sm">
            <span className="font-semibold">{prediction.routeTag}</span>{" "}
            {next.length === 0
              ? "— nothing predicted"
              : next.map((item) => minuteLabel(item.minutes)).join(", ")}
          </li>
        );
      })}
    </ul>
  );
}
