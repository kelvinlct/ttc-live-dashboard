import Link from "next/link";
import { FavouriteBoard } from "@/components/favourite-board";
import { ModeBadge } from "@/components/mode-badge";
import { RouteSearch } from "@/components/route-search";
import { POPULAR_ROUTES } from "@/lib/routes";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold tracking-[0.18em] text-ttc uppercase">Toronto surface transit</p>
        <h1 className="mt-2 font-display text-6xl leading-[0.9] font-semibold sm:text-7xl">
          Next vehicle, in minutes.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Pick a bus or streetcar stop and keep it on a board that refreshes itself. Built for the corner you actually wait on.
        </p>
        <div className="mt-6">
          <RouteSearch />
        </div>
        <h2 className="mt-6 text-sm font-semibold">Popular routes</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {POPULAR_ROUTES.map((route) => (
            <li key={route.tag}>
              <Link href={`/routes/${route.tag}`} className="btn btn-quiet gap-2 px-3">
                <span className="font-display text-xl leading-none">{route.shortName}</span>
                <span>{route.longName}</span>
                <ModeBadge mode={route.mode} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <FavouriteBoard />
    </div>
  );
}
