"use client";
import { useEffect, useMemo, useState } from "react";
import SearchCard from "@/components/SearchCard";
import JourneyCard from "@/components/JourneyCard";
import NearbyPanel from "@/components/NearbyPanel";
import AssistantPanel from "@/components/AssistantPanel";
import type { Action, SortKey } from "@/lib/assistant";
import { fmtDur, fmtTime, inr } from "@/lib/format";
import type { Flexibility, RouteSearch, SearchOutcome } from "@/lib/types";

const NEXT: Record<Flexibility, Flexibility> = { strict: "balanced", balanced: "flexible", flexible: "flexible" };
const SORTS: [SortKey, string][] = [["recommended", "Recommended"], ["fastest", "Fastest"], ["cheapest", "Cheapest"], ["wait", "Least waiting"]];

export default function Home() {
  const [o, setO] = useState<SearchOutcome | null>(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");
  const [sort, setSort] = useState<SortKey>("recommended"); const [maxChanges, setMax] = useState<number | null>(null); const [arriveBy, setBy] = useState<number | null>(null);
  const [cmp, setCmp] = useState<string[]>([]); const [saved, setSaved] = useState<string[]>([]); const [recents, setRecents] = useState<{ from: string; to: string }[]>([]);
  const [override, setOverride] = useState<Partial<RouteSearch>>();
  useEffect(() => { try { setRecents(JSON.parse(localStorage.getItem("rr_recent") ?? "[]")); } catch { /* ignore */ } }, []);

  async function search(s: RouteSearch) {
    setLoading(true); setErr(""); setO(null); setMax(null); setBy(null); setSort("recommended"); setCmp([]);
    try {
      const r = await fetch("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error); setO(d);
      const next = [{ from: s.from, to: s.to }, ...recents.filter((x) => x.from !== s.from || x.to !== s.to)].slice(0, 4); setRecents(next);
      try { localStorage.setItem("rr_recent", JSON.stringify(next)); } catch { /* ignore */ }
    } catch (e) { setErr((e as Error).message); } finally { setLoading(false); }
  }
  const expand = () => { if (!o) return; const f = NEXT[o.search.flexibility]; setOverride({ flexibility: f }); search({ ...o.search, flexibility: f }); };
  const act = (a: Action) => { if (a.maxChanges != null) setMax(a.maxChanges); if (a.arriveBy != null) setBy(a.arriveBy); if (a.sort) setSort(a.sort); };

  const list = useMemo(() => {
    if (!o) return [];
    const a = o.journeys.filter((j) => (maxChanges == null || j.changes <= maxChanges) && (arriveBy == null || j.arrive <= arriveBy));
    if (sort === "fastest") a.sort((x, y) => x.durationMin - y.durationMin);
    if (sort === "cheapest") a.sort((x, y) => (x.fareTotal ?? 1e9) - (y.fareTotal ?? 1e9));
    if (sort === "wait") a.sort((x, y) => x.waitMin - y.waitMin);
    return a;
  }, [o, sort, maxChanges, arriveBy]);
  const toggle = (set: typeof setCmp, id: string, max = 3) => set((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-max)));
  const chosen = o?.journeys.filter((j) => cmp.includes(j.id)) ?? [];

  return (
    <main className="pb-24">
      <section className="hero px-4 pb-16 pt-14 text-center">
        <p className="mx-auto w-fit rounded-full border px-3 py-1 text-[11px] font-bold tracking-widest" style={{ borderColor: "var(--line)", color: "var(--brand)", background: "var(--card)" }}>AI-POWERED RAILWAY JOURNEY PLANNER</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Don&apos;t just find a train.<br /><span style={{ color: "var(--brand)" }}>Find the journey.</span></h1>
        <p className="muted mx-auto mt-4 max-w-xl">RailRoute AI explores direct trains, connections, nearby stations and practical alternatives so you don&apos;t have to search everything manually.</p>
        <div className="track mx-auto mt-8 max-w-xs" aria-hidden />
      </section>
      <div className="mx-auto -mt-8 max-w-6xl px-4">
        <div className="mx-auto max-w-3xl"><SearchCard onSearch={search} loading={loading} recents={recents} initial={override} /></div>
        {loading && <div className="mx-auto mt-8 max-w-3xl space-y-4" aria-busy><p className="muted text-sm">Checking direct trains, nearby stations and connections…</p><div className="skel h-48" /><div className="skel h-48" /></div>}
        {err && <p role="alert" className="card mx-auto mt-8 max-w-3xl p-4 text-sm" style={{ color: "var(--bad)" }}>{err}</p>}
        {o && (
          <section className="mt-10" aria-live="polite">
            <p className="muted text-sm">{o.search.from} → {o.search.to} · {o.search.date} · {o.search.flexibility} flexibility{o.provider.isDemo && " · Demo Data — not for real travel"}</p>
            <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{list.length === 0 && o.journeys.length === 0 ? "We couldn't find a practical journey with the current flexibility settings." : o.headline}</h2>
            <p className="muted mt-1 text-sm">RailRoute AI examined {o.examined} train combinations and found {o.journeys.length} practical option{o.journeys.length === 1 ? "" : "s"}.{o.droppedTight > 0 && ` ${o.droppedTight} connection${o.droppedTight > 1 ? "s were" : " was"} rejected as too tight.`}</p>
            {o.journeys.length === 0 ? (
              <div className="card mt-5 p-6"><p className="font-bold">No direct train found, and no practical alternatives at this flexibility.</p>
                <div className="mt-3 flex flex-wrap gap-2"><button className="btn !py-2" onClick={expand} disabled={o.search.flexibility === "flexible"}>Expand search</button><a className="ghost" href="#plan">Change date</a><a className="ghost" href="#plan">Change time</a><button className="ghost" onClick={expand}>Try nearby stations</button></div></div>
            ) : (
              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sort">{SORTS.map(([k, l]) => <button key={k} className="chip" aria-pressed={sort === k} onClick={() => setSort(k)}>{l}</button>)}
                    {(maxChanges != null || arriveBy != null) && <button className="ghost" onClick={() => { setMax(null); setBy(null); }}>Clear filters{maxChanges != null ? ` · ≤${maxChanges} change` : ""}{arriveBy != null ? ` · before ${fmtTime(arriveBy)}` : ""}</button>}</div>
                  {list.length === 0 && <p className="card p-5 text-sm">No options match these filters. Clear them or expand the search.</p>}
                  {list.map((j) => <JourneyCard key={j.id} j={j} s={o.search} compared={cmp.includes(j.id)} saved={saved.includes(j.id)} onCompare={() => toggle(setCmp, j.id)} onSave={() => toggle(setSaved, j.id, 99)} />)}
                  {chosen.length > 1 && (
                    <div className="card overflow-x-auto p-4"><h3 className="font-extrabold">Compare</h3>
                      <table className="mt-2 w-full text-left text-sm"><thead><tr><th /> {chosen.map((j) => <th key={j.id} className="p-2">{j.segments.map((s) => s.trainNumber).join(" + ")}</th>)}</tr></thead>
                        <tbody>{([["Total time", (j: typeof chosen[0]) => fmtDur(j.durationMin)], ["Changes", (j) => String(j.changes)], ["Waiting", (j) => fmtDur(j.waitMin)], ["Fare", (j) => inr(j.fareTotal)], ["Availability", (j) => j.status], ["Arrives", (j) => fmtTime(j.arrive)]] as [string, (j: typeof chosen[0]) => string][]).map(([k, f]) => <tr key={k} className="border-t" style={{ borderColor: "var(--line)" }}><td className="muted p-2">{k}</td>{chosen.map((j) => <td key={j.id} className="p-2 font-semibold">{f(j)}</td>)}</tr>)}</tbody></table></div>)}
                  <NearbyPanel o={o} onExpand={expand} />
                </div>
                <div className="lg:sticky lg:top-20 lg:self-start"><AssistantPanel o={o} onAction={act} /></div>
              </div>
            )}
          </section>
        )}
        <section id="how" className="mx-auto mt-20 max-w-4xl scroll-mt-20">
          <h2 className="text-center text-2xl font-extrabold">No train found ≠ journey not found</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">{[["1 · Map the network", "Stations are nodes, train runs are edges. We explore direct trains, connections and nearby stations."], ["2 · Reject the impossible", "A connection needs arrival + transfer buffer ≤ next departure. 30 / 45 / 60 min by station type."], ["3 · Rank transparently", "Weights change with your preference. Every card shows the score and the real data behind its explanation."]].map(([t, d]) => <div key={t} className="card p-5"><p className="font-extrabold">{t}</p><p className="muted mt-1 text-sm">{d}</p></div>)}</div>
          <p className="muted mt-6 text-center text-xs">Demo mode uses fictional trains, availability and fares. Real data arrives through the RailwayProvider interface. Availability with no verified source is shown as Unknown.</p>
        </section>
      </div>
    </main>
  );
}
