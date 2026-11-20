"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import useSWR from "swr";
import { ErrorState, Skeleton } from "@/components/states";
import { apiFetcher, REFRESH_MS } from "@/lib/fetcher";
import type { RouteConfig, Vehicle } from "@/lib/nextbus/types";

const RouteMap = dynamic(() => import("@/components/route-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-80" />,
});

type RouteResponse = { route: RouteConfig };
type VehiclesResponse = { vehicles: Vehicle[] };

export function RouteMapView({ tag }: { tag: string }) {
  const route = useSWR<RouteResponse>(`/api/routes/${encodeURIComponent(tag)}`, apiFetcher, {
    revalidateOnFocus: false,
  });
  const vehicles = useSWR<VehiclesResponse>(
    `/api/vehicles?route=${encodeURIComponent(tag)}`,
    apiFetcher,
    { refreshInterval: REFRESH_MS.vehicles },
  );

  if (route.isLoading) {
    return <Skeleton className="h-[70vh]" />;
  }

  if (route.error || !route.data) {
    return (
      <ErrorState
        title="Map unavailable"
        message={route.error instanceof Error ? route.error.message : "This route could not be loaded."}
        onRetry={() => void route.mutate()}
      />
    );
  }

  const list = vehicles.data?.vehicles ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            <Link href={`/routes/${tag}`} className="underline">
              ← Route {route.data.route.shortName} {route.data.route.longName}
            </Link>
          </p>
          <h1 className="font-display text-5xl font-semibold">Live vehicles</h1>
        </div>
        <p className="text-sm text-muted">
          {vehicles.isValidating ? "Refreshing positions…" : `${list.length} reporting · every 15 seconds`}
        </p>
      </div>

      {vehicles.error ? (
        <ErrorState
          message={vehicles.error instanceof Error ? vehicles.error.message : "Vehicle positions did not load."}
          onRetry={() => void vehicles.mutate()}
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="h-[70vh] min-h-80 overflow-hidden rounded-2xl border border-line">
          <RouteMap route={route.data.route} vehicles={list} />
        </div>
        <section aria-label="Vehicles on this route" className="card max-h-[70vh] overflow-auto p-3">
          {list.length === 0 ? (
            <p className="p-2 text-sm text-muted">
              No vehicles are reporting on this route right now. The line on the map is the scheduled path.
            </p>
          ) : (
            <ul className="flex flex-col">
              {list.map((vehicle) => (
                <li key={vehicle.id} className="border-b border-line px-2 py-2 last:border-b-0">
                  <p className="font-semibold">Vehicle {vehicle.id}</p>
                  <p className="text-sm text-muted">
                    {Math.round(vehicle.speedKmHr)} km/h · {vehicle.secsSinceReport}s ago
                    {vehicle.predictable ? "" : " · not predicting"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
