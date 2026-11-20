import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NEXTBUS_ENDPOINT, getRouteConfig, getRouteList } from "../src/lib/nextbus/client";
import type { IndexedStop, StopIndexFile } from "../src/lib/geo";

const OUTPUT = path.join(process.cwd(), "src/data/stops.json");
const CONCURRENCY = 8;

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

function round(value: number): number {
  return Math.round(value * 1e5) / 1e5;
}

async function main(): Promise<void> {
  const routes = await getRouteList();
  console.log(`Indexing stops across ${routes.length} routes`);
  let done = 0;
  let failed = 0;

  const configs = await mapPool(routes, CONCURRENCY, async (route) => {
    try {
      const config = await getRouteConfig(route.tag);
      done += 1;
      if (done % 25 === 0) console.log(`  ${done}/${routes.length}`);
      return config;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "unknown error";
      console.warn(`  skip ${route.tag}: ${message}`);
      return null;
    }
  });

  const byId = new Map<string, IndexedStop>();
  for (const config of configs) {
    if (!config) continue;
    const stops = new Map(config.stops.map((stop) => [stop.tag, stop]));
    const seenOnRoute = new Set<string>();
    for (const direction of config.directions) {
      for (const stopTag of direction.stopTags) {
        const stop = stops.get(stopTag);
        if (!stop?.stopId || seenOnRoute.has(stop.stopId)) continue;
        seenOnRoute.add(stop.stopId);
        const pair: [string, string] = [config.tag, stop.tag];
        const existing = byId.get(stop.stopId);
        if (!existing) {
          byId.set(stop.stopId, {
            id: stop.stopId,
            name: stop.title,
            lat: round(stop.lat),
            lon: round(stop.lon),
            routes: [pair],
          });
          continue;
        }
        if (!existing.routes.some(([routeTag, tag]) => routeTag === pair[0] && tag === pair[1])) {
          existing.routes.push(pair);
        }
      }
    }
  }

  const stops = [...byId.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  const file: StopIndexFile = {
    generatedAt: new Date().toISOString(),
    source: NEXTBUS_ENDPOINT,
    stopCount: stops.length,
    stops,
  };

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(file));
  console.log(`Wrote ${stops.length} stops (${failed} routes skipped) to ${OUTPUT}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
