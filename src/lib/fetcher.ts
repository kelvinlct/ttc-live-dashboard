export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    let message = `Could not load TTC data (${response.status}).`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === "string" && body.error) message = body.error;
    } catch {
      // The body was not JSON. The status message is enough.
    }
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export const REFRESH_MS = {
  predictions: 20_000,
  vehicles: 15_000,
  alerts: 60_000,
} as const;
