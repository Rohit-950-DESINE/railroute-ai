import type { NearbyStation, SearchOutcome } from "@/lib/types";

export default function NearbyPanel({ o, onExpand }: { o: SearchOutcome; onExpand: () => void }) {
  const used = new Set(o.journeys.flatMap((j) => [j.originNearby?.station.code, j.destNearby?.station.code]));
  const Col = ({ title, req, list }: { title: string; req: string; list: NearbyStation[] }) => (
    <div>
      <p className="lbl">{title}</p>
      <p className="text-sm font-semibold">{req} <span className="muted font-normal">· requested station</span></p>
      {list.length === 0 && <p className="muted mt-1 text-sm">No nearby stations in this demo dataset.</p>}
      {list.map((n) => (
        <div key={n.station.code} className="mt-2 text-sm">
          <p className="font-semibold">{n.station.name} <span className="muted font-normal">· ~{n.distanceKm} km, ~{n.roadMinutes} min by road</span></p>
          <p className="muted text-xs">{n.note}. {used.has(n.station.code) ? "Used in the options below." : "Not used in current results."} Extra cost to reach it is unknown.</p>
        </div>
      ))}
    </div>
  );
  return (
    <section className="card mt-4 p-5" aria-label="Nearby stations">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-extrabold">Nearby station intelligence</h3>
        {o.search.flexibility === "strict" && <button className="ghost" onClick={onExpand}>Try nearby stations</button>}
      </div>
      <p className="muted mt-1 text-sm">Distant stations add travel and cost. They are only suggested with the trade-off shown, and the ticket must start at a valid boarding point.</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2"><Col title="NEAR YOUR ORIGIN" req={o.search.from} list={o.nearbyOrigin} /><Col title="NEAR YOUR DESTINATION" req={o.search.to} list={o.nearbyDest} /></div>
    </section>
  );
}
