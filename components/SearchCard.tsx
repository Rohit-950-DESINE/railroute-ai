"use client";
import { useEffect, useState } from "react";
import { parseQuery } from "@/lib/nlu";
import type { Flexibility, Preference, RouteSearch } from "@/lib/types";

const PREFS: [Preference, string][] = [["best", "Best Overall"], ["fastest", "Fastest"], ["cheapest", "Cheapest"], ["fewest_changes", "Fewest Changes"], ["availability", "Best Availability"], ["least_walking", "Least Walking"], ["comfortable", "Comfortable"]];
const FLEX: [Flexibility, string, string][] = [
  ["strict", "Strict", "Only your stations and a 3-hour departure window. Direct trains only."],
  ["balanced", "Balanced", "Nearby stations within 50 km, one change, and a wider time window."],
  ["flexible", "Flexible", "Nearby stations up to 120 km, up to two changes, and a much wider time range."],
];
export default function SearchCard({ onSearch, loading, recents, initial }: { onSearch: (s: RouteSearch) => void; loading: boolean; recents: { from: string; to: string }[]; initial?: Partial<RouteSearch> }) {
  const [s, setS] = useState<RouteSearch>({ from: "Jammu", to: "Ludhiana", date: "", departAfter: "08:00", passengers: 1, travelClass: "ANY", preference: "best", flexibility: "balanced", minTransferMin: 30, ...initial });
  const [nl, setNl] = useState(""); const [msg, setMsg] = useState("");
  useEffect(() => setS((p) => ({ ...p, date: p.date || new Date(Date.now() + 864e5).toISOString().slice(0, 10) })), []);
  useEffect(() => { if (initial) setS((p) => ({ ...p, ...initial })); }, [initial]);
  const set = <K extends keyof RouteSearch>(k: K, v: RouteSearch[K]) => setS((p) => ({ ...p, [k]: v }));
  const fill = () => { const r = parseQuery(nl); setS((p) => ({ ...p, ...r.fields })); setMsg(r.missing.length ? `I still need your ${r.missing.join(" and ")}.` : "Done. I've filled the form from your sentence."); };
  const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block"><span className="lbl">{t}</span>{children}</label>;
  return (
    <form id="plan" className="card p-4 sm:p-6" aria-label="Journey search" onSubmit={(e) => { e.preventDefault(); onSearch(s); }}>
      <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
        <L t="FROM"><input className="field" value={s.from} onChange={(e) => set("from", e.target.value)} placeholder="City, station or code" required /></L>
        <button type="button" className="ghost mx-auto !rounded-full !px-3 !py-2.5" aria-label="Swap From and To" onClick={() => setS((p) => ({ ...p, from: p.to, to: p.from }))}>⇄</button>
        <L t="TO"><input className="field" value={s.to} onChange={(e) => set("to", e.target.value)} placeholder="City, station or code" required /></L>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <L t="DATE"><input type="date" className="field" value={s.date} onChange={(e) => set("date", e.target.value)} required /></L>
        <L t="DEPARTURE TIME"><input type="time" className="field" value={s.departAfter} onChange={(e) => set("departAfter", e.target.value)} /></L>
        <L t="PASSENGERS"><input type="number" min={1} max={6} className="field" value={s.passengers} onChange={(e) => set("passengers", Math.max(1, +e.target.value || 1))} /></L>
        <L t="CLASS"><select className="field" value={s.travelClass} onChange={(e) => set("travelClass", e.target.value as RouteSearch["travelClass"])}>{["ANY", "SL", "3A", "2A", "CC", "2S"].map((c) => <option key={c} value={c}>{c === "ANY" ? "Any" : c}</option>)}</select></L>
      </div>
      <p className="lbl mt-4">WHAT MATTERS MOST</p>
      <div role="radiogroup" aria-label="Preference" className="flex gap-2 overflow-x-auto pb-1">{PREFS.map(([v, l]) => <button type="button" role="radio" aria-checked={s.preference === v} key={v} className="chip" onClick={() => set("preference", v)}>{l}</button>)}</div>
      <p className="lbl mt-3">JOURNEY FLEXIBILITY</p>
      <div role="radiogroup" aria-label="Journey flexibility" className="grid grid-cols-3 gap-2">{FLEX.map(([v, l]) => <button type="button" role="radio" aria-checked={s.flexibility === v} key={v} className="chip !rounded-xl text-center" onClick={() => set("flexibility", v)}>{l}</button>)}</div>
      <p className="muted mt-1.5 text-xs">{FLEX.find((f) => f[0] === s.flexibility)![2]}</p>
      <div className="mt-4 flex gap-2">
        <input className="field" aria-label="Describe your trip" value={nl} onChange={(e) => setNl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), fill())} placeholder='Try: "Find me a cheap route from Jammu to Ludhiana tomorrow morning"' />
        <button type="button" className="ghost shrink-0" onClick={fill}>✨ Fill</button>
      </div>
      {msg && <p className="muted mt-1 text-xs" role="status">{msg}</p>}
      {recents.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="muted">Recent:</span>{recents.map((r) => <button type="button" key={r.from + r.to} className="chip !px-3 !py-1 text-xs" onClick={() => setS((p) => ({ ...p, from: r.from, to: r.to }))}>{r.from} → {r.to}</button>)}</div>}
      <button className="btn mt-4 w-full" disabled={loading}>{loading ? "Exploring routes…" : "Find My Journey →"}</button>
    </form>
  );
}
