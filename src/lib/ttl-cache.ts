type Entry = { expires: number; value: unknown };

/**
 * In-process TTL cache with in-flight de-duplication.
 * Warm serverless instances reuse it; a cold start just fetches again.
 */
export class TtlCache {
  private readonly store = new Map<string, Entry>();
  private readonly pending = new Map<string, Promise<unknown>>();

  async get<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const hit = this.store.get(key);
    if (hit && hit.expires > Date.now()) return hit.value as T;

    const inflight = this.pending.get(key);
    if (inflight) return inflight as Promise<T>;

    const promise = loader()
      .then((value) => {
        this.store.set(key, { expires: Date.now() + ttlMs, value });
        this.pending.delete(key);
        return value;
      })
      .catch((error: unknown) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    return promise;
  }

  clear(): void {
    this.store.clear();
    this.pending.clear();
  }
}
