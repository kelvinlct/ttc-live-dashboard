export function ErrorState({
  title = "Could not load TTC data",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="card p-6">
      <h2 className="font-display text-3xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-prose text-muted">{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-ttc mt-4" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <h2 className="font-display text-3xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-prose text-muted">{message}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-line/80 ${className}`} aria-hidden="true" />;
}
