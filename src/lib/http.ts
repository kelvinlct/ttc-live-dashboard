import { isKnownError, statusFor } from "@/lib/errors";

export function jsonOk(data: unknown, cacheControl: string): Response {
  return Response.json(data, {
    headers: { "Cache-Control": cacheControl },
  });
}

export function jsonError(error: unknown): Response {
  if (isKnownError(error)) {
    return Response.json(
      { error: error.message },
      { status: statusFor(error), headers: { "Cache-Control": "no-store" } },
    );
  }
  console.error(error);
  return Response.json(
    { error: "Something went wrong while loading TTC data." },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export function jsonBadRequest(message: string): Response {
  return Response.json(
    { error: message },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}
