import { describe, expect, it, vi } from "vitest";
import { TtlCache } from "@/lib/ttl-cache";

describe("TtlCache", () => {
  it("returns a cached value until the ttl expires", async () => {
    vi.useFakeTimers();
    const cache = new TtlCache();
    const loader = vi.fn(async () => "one");

    await expect(cache.get("k", 1_000, loader)).resolves.toBe("one");
    await expect(cache.get("k", 1_000, loader)).resolves.toBe("one");
    expect(loader).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1_001);
    loader.mockResolvedValueOnce("two");
    await expect(cache.get("k", 1_000, loader)).resolves.toBe("two");
    expect(loader).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("shares one in-flight load", async () => {
    const cache = new TtlCache();
    let resolve: (value: string) => void = () => {};
    const loader = vi.fn(
      () =>
        new Promise<string>((done) => {
          resolve = done;
        }),
    );

    const first = cache.get("k", 1_000, loader);
    const second = cache.get("k", 1_000, loader);
    expect(loader).toHaveBeenCalledTimes(1);
    resolve("shared");
    await expect(first).resolves.toBe("shared");
    await expect(second).resolves.toBe("shared");
  });

  it("does not cache a failed load", async () => {
    const cache = new TtlCache();
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("nope"))
      .mockResolvedValueOnce("ok");

    await expect(cache.get("k", 1_000, loader)).rejects.toThrow("nope");
    await expect(cache.get("k", 1_000, loader)).resolves.toBe("ok");
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
