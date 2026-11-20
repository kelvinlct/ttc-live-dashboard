"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Board" },
  { href: "/nearby", label: "Nearby" },
  { href: "/alerts", label: "Alerts" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-md">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ttc text-[11px] font-bold tracking-wide text-white">
            TTC
          </span>
          <span className="font-display text-3xl leading-none font-semibold tracking-tight">Live</span>
        </Link>
        <nav aria-label="Primary" className="ml-auto flex items-center gap-1">
          {LINKS.map((link) => {
            const current = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm font-semibold ${
                  current ? "bg-ink text-paper" : "text-ink hover:bg-line/70"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
