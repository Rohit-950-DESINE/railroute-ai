"use client";
import { useState } from "react";
import type { Journey, RouteSearch } from "@/lib/types";
import { fmtDur, fmtTime, inr } from "@/lib/format";
import StatusPill from "./StatusPill";
import RouteMap from "./RouteMap";

export default function JourneyCard({ j, s, compared, saved, onCompare, onSave }: { j: Journey; s: RouteSearch; compared: boolean; saved: boolean; onCompare: () => void; onSave: () => void }) {
  const [open, setOpen] = useState(false); const last = j.segments[j.segments.length - 1], first = j.segments[0];
  const nearby = j.originNearby || j.destNearby;
  return (
    <article className="card p-5" style={j.tags[0] === "Best match" ? { borderColor: "var(--brand)", borderWidth: 2 } : undefined}>
      <div className="flex flex-wrap items-center gap-1.5">
        {j.tags.map((t) => <span key={t} className="pill" style={{ color: t === "Best match" ? "var(--brand)" : "var(--mut)" }}>{t === "Best match" ? "★ Recommended · Best match" : t}</span>)}
        {nearby && <span className="pill s-WAITLIST">Alternative station</span>}
        {j.dataSource === "demo" && <span className="pill s-UNKNOWN">Demo data</span>}
      </div>
      <div className="mt-4">
        {j.segments.map((sg, i) => (
          <div key={sg.trainNumber + sg.from.code}>
            <div className="flex items-baseline justify-between gap-3"><p className="text-lg font-extrabold">{fmtTime(sg.dep)} <span className="font-bold">{sg.from.name}</span></p></div>
            <div className="my-1 ml-1 border-l-2 pl-4 py-2 text-sm" style={{ borderColor: "var(--brand)" }}>
              <p className="font-semibold">{sg.trainName} <span className="muted font-normal">· {sg.trainType} · {sg.trainNumber} · {fmtDur(sg.arr - sg.dep)}</span></p>
              <div className="mt-1 flex flex-wrap gap-1.5">{Object.entries(sg.classes).map(([c, a]) => <StatusPill key={c} s={a!.status} label={c} />)}</div>
            </div>
            <p className="text-lg font-extrabold">{fmtTime(sg.arr)} <span className="font-bold">{sg.to.name}</span></p>
            {j.transfers[i] && <p className="my-2 rounded-xl px-3 py-1.5 text-sm font-semibold" style={{ background: "var(--soft)" }}>⏱ {fmtDur(j.transfers[i].minutes)} transfer at {j.transfers[i].station.name} <span className="muted font-normal">(min {j.transfers[i].requiredMinutes} m)</span></p>}
          </div>
        ))}
      </div>
      {nearby && (
        <div className="mt-3 rounded-xl border p-3 text-sm" style={{ borderColor: "var(--line)" }}>
          <p><b>Requested:</b> {s.from} → {s.to}</p>
          {j.originNearby && <p><b>Alternative boarding station:</b> {first.from.name}, ~{j.originNearby.distanceKm} km (~{j.originNearby.roadMinutes} min by road) from {s.from}. Ticket origin = boarding point = {first.from.name}.</p>}
          {j.destNearby && <p><b>Alternative arrival station:</b> {last.to.name}, ~{j.destNearby.distanceKm} km (~{j.destNearby.roadMinutes} min by road) from {s.to}.</p>}
          <p className="muted text-xs">Extra cost for the road leg is unknown. Verify boarding rules before booking.</p>
        </div>
      )}
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl p-3 text-center sm:grid-cols-5" style={{ background: "var(--bg)" }}>
        {[["Total", fmtDur(j.durationMin)], ["Changes", String(j.changes)], ["Fare", inr(j.fareTotal) + (j.fareTotal != null && j.dataSource === "demo" ? " (demo)" : "")], ["Extra road", j.extraRoadMin ? `~${j.extraRoadMin} min` : "None"]].map(([k, v]) => <div key={k}><dt className="lbl !mb-0">{k.toUpperCase()}</dt><dd className="text-sm font-bold">{v}</dd></div>)}
        <div className="col-span-2 sm:col-span-1"><dt className="lbl !mb-0">AVAILABILITY</dt><dd><StatusPill s={j.status} /></dd></div>
      </dl>
      <details className="mt-3 text-sm"><summary className="cursor-pointer font-bold">Why RailRoute AI suggested this</summary>
        <p className="mt-2 font-semibold">{j.explanation.summary}</p>
        <ul className="muted mt-1 list-disc space-y-1 pl-5">{j.explanation.points.map((p) => <li key={p}>{p}</li>)}</ul>
        <p className="lbl mt-3">HOW IT WAS SCORED (LOWER IS BETTER)</p>
        <ul className="muted text-xs">{j.scoreParts.map((p) => <li key={p.factor} className="flex justify-between"><span>{p.factor} ({Math.round(p.value)} × {p.weight})</span><span>{p.contribution}</span></li>)}<li className="flex justify-between font-bold" style={{ color: "var(--fg)" }}><span>Total</span><span>{j.score}</span></li></ul>
      </details>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn !py-2" onClick={() => setOpen(!open)} aria-expanded={open}>View Journey</button>
        <button className="ghost" aria-pressed={compared} onClick={onCompare}>{compared ? "✓ Comparing" : "Compare"}</button>
        <button className="ghost" aria-pressed={saved} onClick={onSave}>{saved ? "★ Saved" : "☆ Save"}</button>
      </div>
      {open && (
        <div className="mt-4 space-y-3 text-sm">
          <RouteMap j={j} />
          <p className="muted">Availability checked: {first.availability.checkedAt ? new Date(first.availability.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "no verified source"} · source: {first.availability.source}</p>
          <button className="ghost" disabled title="Connects to an authorized booking provider when integrated">Continue to booking (not connected)</button>
          <p className="muted text-xs">Availability and fare are subject to change. Verify final details on the booking provider before payment.</p>
        </div>
      )}
    </article>
  );
}
