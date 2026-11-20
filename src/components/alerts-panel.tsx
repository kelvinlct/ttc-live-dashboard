"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ErrorState, Skeleton } from "@/components/states";
import type { ServiceAlert } from "@/lib/alerts/parse";
import { apiFetcher, REFRESH_MS } from "@/lib/fetcher";
import { formatAlertWindow } from "@/lib/format";

type AlertsResponse = { alerts: ServiceAlert[]; lastUpdated: string | null };

const FILTERS = [
  { id: "all", label: "All" },
  { id: "bus", label: "Bus" },
  { id: "streetcar", label: "Streetcar" },
  { id: "subway", label: "Subway" },
  { id: "accessibility", label: "Elevators" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

export function AlertsPanel() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const { data, error, isLoading, mutate } = useSWR<AlertsResponse>("/api/alerts", apiFetcher, {
    refreshInterval: REFRESH_MS.alerts,
  });

  const alerts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.alerts ?? []).filter((alert) => {
      if (filter === "accessibility" && alert.kind !== "accessibility") return false;
      if (filter !== "all" && filter !== "accessibility") {
        if (alert.kind !== "service") return false;
        if (filter === "bus" && alert.routeType !== "Bus") return false;
        if (filter === "streetcar" && alert.routeType !== "Streetcar") return false;
        if (filter === "subway" && alert.routeType !== "Subway") return false;
      }
      if (!needle) return true;
      const haystack = `${alert.headerText} ${alert.effectDesc} ${alert.route} ${alert.stopStart} ${alert.stopEnd}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [data?.alerts, filter, query]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-5xl font-semibold">Service alerts</h1>
        <p className="mt-2 max-w-prose text-muted">
          Detours, closures, reduced speed zones, and elevator outages published by the TTC.
          {data?.lastUpdated ? ` Updated ${formatAlertWindow(data.lastUpdated, null).replace("Since ", "")}.` : ""}
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div role="group" aria-label="Alert type" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="btn btn-quiet"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label htmlFor="alert-search" className="text-sm font-semibold">
          Search alerts
        </label>
        <input
          id="alert-search"
          className="field"
          value={query}
          placeholder="Station, route, or street"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {isLoading ? <Skeleton className="h-40" /> : null}
      {error ? (
        <ErrorState
          message={error instanceof Error ? error.message : "Alerts did not load."}
          onRetry={() => void mutate()}
        />
      ) : null}

      {data && alerts.length === 0 ? (
        <p className="card p-5 text-muted">No alerts match that filter.</p>
      ) : null}

      <ul className="flex flex-col gap-3">
        {alerts.map((alert) => (
          <li
            key={`${alert.kind}-${alert.id}`}
            className={`card border-l-4 p-4 ${alert.severity === "Critical" ? "border-l-ttc" : "border-l-due"}`}
          >
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">
              {[alert.routeType, alert.effectDesc, alert.severity].filter(Boolean).join(" · ")}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{alert.headerText}</h2>
            <p className="mt-2 text-sm text-muted">
              {[
                alert.route ? `Routes ${alert.route}` : "",
                alert.direction,
                alert.stopStart && alert.stopEnd ? `${alert.stopStart} to ${alert.stopEnd}` : "",
                alert.elevatorCode ? `Elevator ${alert.elevatorCode}` : "",
                alert.escalatorCode ? `Escalator ${alert.escalatorCode}` : "",
                formatAlertWindow(alert.start, alert.end),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
