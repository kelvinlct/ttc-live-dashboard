"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ModeBadge } from "@/components/mode-badge";
import { apiFetcher } from "@/lib/fetcher";
import { filterRoutes, type RouteSummary } from "@/lib/routes";

type RoutesResponse = { routes: RouteSummary[] };

export function RouteSearch() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { data, error, isLoading } = useSWR<RoutesResponse>("/api/routes", apiFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60 * 60 * 1000,
  });

  const results = useMemo(
    () => filterRoutes(data?.routes ?? [], query),
    [data?.routes, query],
  );

  const selected = results.length === 0 ? 0 : Math.min(active, results.length - 1);

  useEffect(() => {
    function onPointer(event: PointerEvent) {
      if (!inputRef.current?.closest("[data-search]")?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  function choose(route: RouteSummary) {
    setOpen(false);
    setQuery("");
    router.push(`/routes/${route.tag}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[selected]) {
      event.preventDefault();
      choose(results[selected]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const expanded = open && query.trim().length > 0;

  return (
    <div data-search className="relative">
      <label htmlFor="route-search" className="text-sm font-semibold">
        Find a route
      </label>
      <input
        ref={inputRef}
        id="route-search"
        className="field mt-2"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && results[selected] ? `${listId}-${results[selected].tag}` : undefined}
        placeholder="504 King, Queen, Finch West…"
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <p className="mt-2 text-sm text-muted" aria-live="polite">
        {isLoading ? "Loading the route list…" : null}
        {error ? "The route list did not load. Popular routes below still work." : null}
      </p>
      {expanded ? (
        <ul
          id={listId}
          role="listbox"
          className="card absolute z-20 mt-2 max-h-80 w-full overflow-auto p-1"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted">No routes match “{query.trim()}”.</li>
          ) : (
            results.map((route, index) => (
              <li key={route.tag} role="presentation">
                <button
                  id={`${listId}-${route.tag}`}
                  type="button"
                  role="option"
                  aria-selected={index === selected}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left ${
                    index === selected ? "bg-line/70" : "hover:bg-line/40"
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(route)}
                >
                  <span className="font-display w-14 text-2xl font-semibold">{route.shortName}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{route.longName}</span>
                  <ModeBadge mode={route.mode} />
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
