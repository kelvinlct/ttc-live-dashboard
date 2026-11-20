import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card p-6">
      <h1 className="font-display text-4xl font-semibold">That page is not on the line</h1>
      <p className="mt-2 text-muted">The route or stop may have changed. Head back to the board and search again.</p>
      <Link href="/" className="btn btn-ttc mt-4">
        Back to the board
      </Link>
    </div>
  );
}
