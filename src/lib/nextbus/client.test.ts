import { describe, expect, it, vi } from "vitest";
import { buildFeedUrl, createFeedClient, getPredictions, getRouteList } from "@/lib/nextbus/client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("buildFeedUrl", () => {
  it("repeats multi-stop parameters", () => {
    const url = buildFeedUrl({
      command: "predictionsForMultiStops",
      a: "ttc",
      stops: ["504|1389", "501|2201"],
    });
    expect(url).toContain("command=predictionsForMultiStops");
    expect(url).toContain("stops=504%7C1389");
    expect(url).toContain("stops=501%7C2201");
  });
});

describe("feed client", () => {
  it("parses the route list and caches the response", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ route: [{ tag: "501", title: "501-Queen" }] }),
    );
    const client = createFeedClient(fetchImpl as typeof fetch);
    const first = await getRouteList(client);
    const second = await getRouteList(client);
    expect(first[0].longName).toBe("Queen");
    expect(second).toEqual(first);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("turns a feed error into a parse failure for predictions", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        Error: { shouldRetry: "false", content: "For agency=ttc route r=9999 is not valid." },
      }),
    );
    const client = createFeedClient(fetchImpl as typeof fetch);
    await expect(
      getPredictions({ routeTag: "9999", stopTag: "1" }, client),
    ).rejects.toThrow(/not valid/);
  });

  it("reports an upstream HTTP failure", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ message: "no" }, 503));
    const client = createFeedClient(fetchImpl as typeof fetch);
    await expect(getRouteList(client)).rejects.toThrow(/HTTP 503/);
  });
});
