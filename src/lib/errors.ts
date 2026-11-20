export class FeedParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedParseError";
  }
}

export class UpstreamError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
  }
}

export function isKnownError(
  error: unknown,
): error is FeedParseError | UpstreamError {
  return error instanceof FeedParseError || error instanceof UpstreamError;
}

export function statusFor(error: FeedParseError | UpstreamError): number {
  if (error instanceof UpstreamError) return error.status;
  if (/not found|none of the directions/i.test(error.message)) return 404;
  return 502;
}
