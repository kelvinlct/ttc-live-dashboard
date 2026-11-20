import { modeAccent, modeLabel, type RouteMode } from "@/lib/routes";

export function ModeBadge({ mode }: { mode: RouteMode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase"
      style={{ color: modeAccent(mode), background: `${modeAccent(mode)}1a` }}
    >
      {modeLabel(mode)}
    </span>
  );
}
