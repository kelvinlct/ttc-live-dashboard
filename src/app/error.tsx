"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="card p-6">
      <h1 className="font-display text-4xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted">{error.message || "The page could not be shown."}</p>
      <button type="button" className="btn btn-ttc mt-4" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
