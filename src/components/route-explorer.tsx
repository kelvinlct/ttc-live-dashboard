"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { ModeBadge } from "@/components/mode-badge";
import { ErrorState, Skeleton } from "@/components/states";
import type { ServiceAlert } from "@/lib/alerts/parse";
import { apiFetcher } from "@/lib/fetcher";
import { modeAccent } from "@/lib/routes";
import type { RouteConfig, Stop } from "@/lib/nextbus/types";

type RouteResponse = { route: RouteConfig };
type AlertsResponse = { alerts: ServiceAlert[] };

export function RouteExplorer({ tag }: { tag: string }) {
  const { data, error, isLoading, mutate } = useSWR<RouteResponse>(
    `/api/routes/${encodeURIComponent(tag)}`,
    apiFetcher,
    { revalidateOnFocus: false },
  );
  const alerts = useSWR<AlertsResponse>(`/api/alerts?route=${encodeURIComponent(tag)}`, apiFetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-28" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Route unavailable"
        message={error instanceof Error ? error.message : "This route could not be loaded."}
        onRetry={() => void mutate()}
      />
    );
  }

  return <RouteBody route={data.route} alerts={alerts.data?.alerts ?? []} />;
}

function RouteBody({ route, alerts }: { route: RouteConfig; alerts: ServiceAlert[] }) {
  const [selected, setSelected] = useState(route.directions[0]?.tag ?? "");
  const [filter, setFilter] = useState("");
  const direction = route.directions.find((item) => item.tag === selected) ?? route.directions[0];
  const stopsByTag = useMemo(() => new Map(route.stops.map((stop) => [stop.tag, stop])), [route.stops]);
  const accent = route.color ?? modeAccent(route.mode);

  const stops = useMemo(() => {
    if (!direction) return [];
    const needle = filter.trim().toLowerCase();
    return direction.stopTags.flatMap((stopTag) => {
      const stop = stopsByTag.get(stopTag);
      if (!stop) return [];
      if (needle && !stop.title.toLowerCase().includes(needle) && !stop.stopId.includes(needle)) {
        return [];
      }
      return [stop];
    });
  }, [direction, filter, stopsByTag]);

  function onTabsKeyDown(event: React.KeyboardEvent) {
    if (!direction || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return;
    event.preventDefault();
    const index = route.directions.findIndex((item) => item.tag === direction.tag);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = route.directions[(index + delta + route.directions.length) % route.directions.length];
    setSelected(next.tag);
    document.getElementById(`dir-${next.tag}`)?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="card overflow-hidden">
        <div className="h-2" style={{ background: accent }} />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-muted uppercase">Route</p>
            <h1 className="font-display text-6xl leading-none font-semibold">
              <span style={{ color: accent }}>{route.shortName}</span> {route.longName}
            </h1>
            <div className="mt-3">
              <ModeBadge mode={route.mode} />
            </div>
          </div>
          <Link href={`/routes/${route.tag}/map`} className="btn btn-ttc">
            Live map
          </Link>
        </div>
      </header>

      {alerts.length > 0 ? (
        <aside className="card border-l-4 border-l-ttc p-4" aria-label="Service alerts">
          <h2 className="font-semibold">Service alerts on this route</h2>
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {alerts.slice(0, 3).map((alert) => (
              <li key={alert.id}>{alert.headerText}</li>
            ))}
          </ul>
          <Link href="/alerts" className="mt-3 inline-block text-sm font-semibold underline">
            All alerts
          </Link>
        </aside>
      ) : null}

      {route.directions.length === 0 ? (
        <p className="text-muted">This route has no published directions right now.</p>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="Direction"
            className="flex gap-2 overflow-x-auto pb-1"
            onKeyDown={onTabsKeyDown}
          >
            {route.directions.map((item) => {
              const active = item.tag === direction?.tag;
              return (
                <button
                  key={item.tag}
                  id={`dir-${item.tag}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="stop-list"
                  tabIndex={active ? 0 : -1}
                  className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-left text-sm font-semibold ${
                    active ? "bg-ink text-paper" : "border border-line bg-card"
                  }`}
                  onClick={() => setSelected(item.tag)}
                >
                  {item.title}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" id="stop-list" aria-labelledby={direction ? `dir-${direction.tag}` : undefined}>
            <label htmlFor="stop-filter" className="text-sm font-semibold">
              Filter stops
            </label>
            <input
              id="stop-filter"
              className="field mt-2"
              value={filter}
              placeholder="Street name or stop number"
              onChange={(event) => setFilter(event.target.value)}
            />
            {stops.length === 0 ? (
              <p className="mt-4 text-muted">No stops match that filter.</p>
            ) : (
              <ol className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {stops.map((stop, index) => (
                  <StopRow key={`${stop.tag}-${index}`} stop={stop} index={index} routeTag={route.tag} />
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StopRow({ stop, index, routeTag }: { stop: Stop; index: number; routeTag: string }) {
  return (
    <li>
      <Link
        href={`/routes/${routeTag}/stops/${stop.tag}`}
        className="flex items-center gap-4 px-4 py-3 hover:bg-paper"
      >
        <span className="font-display w-8 text-xl text-muted">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{stop.title}</span>
          <span className="text-sm text-muted">Stop {stop.stopId}</span>
        </span>
        <span aria-hidden="true" className="text-muted">
          →
        </span>
      </Link>
    </li>
  );
}
