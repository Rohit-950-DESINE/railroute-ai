import type { Journey } from "@/lib/types";

/** Map-ready placeholder. When a map provider is configured, render it here using station coordinates from the provider. */
export default function RouteMap({ j }: { j: Journey }) {
  const stops = [j.segments[0].from, ...j.segments.map((s) => s.to)];
  return (
    <div className="rounded-2xl border border-dashed p-4" style={{ borderColor: "var(--line)" }} role="img" aria-label={`Route: ${stops.map((s) => s.name).join(" to ")}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {stops.map((s, i) => <span key={s.code + i} className="flex items-center gap-2"><span className="rounded-lg px-2 py-1" style={{ background: "var(--soft)" }}>{i === 0 ? "● " : i === stops.length - 1 ? "◆ " : "○ "}{s.name}</span>{i < stops.length - 1 && <span className="muted">→</span>}</span>)}
      </div>
      <p className="muted mt-2 text-xs">Interactive map not configured. Coordinates are not faked; connect a map provider to draw the route.</p>
    </div>
  );
}
