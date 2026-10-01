import type { Availability, Journey, JourneySegment, NearbyStation, RouteSearch, SearchOutcome, Station, Train, TravelClass } from "./types";
import type { RailwayProvider } from "./providers/types";
import { RANK, explain, scoreJourneys } from "./scoring";
import { parseHM } from "./format";

/** Journey Flexibility presets. */
export const FLEX = {
  strict: { radius: 0, maxChanges: 0, before: 0, after: 180, maxWait: 90 },
  balanced: { radius: 50, maxChanges: 1, before: 60, after: 360, maxWait: 240 },
  flexible: { radius: 120, maxChanges: 2, before: 120, after: 840, maxWait: 720 },
} as const;
/** Minimum transfer by station type; the user's own minimum can only raise it. */
export const requiredTransfer = (st: Station, userMin: number) => Math.max(userMin, st.complex ? 60 : st.major ? 45 : 30);

interface Raw { train: Train; from: Station; to: Station; dep: number; arr: number }

export async function searchJourneys(p: RailwayProvider, s: RouteSearch): Promise<SearchOutcome> {
  const cfg = FLEX[s.flexibility];
  const [o, d] = await Promise.all([p.searchStations(s.from), p.searchStations(s.to)]);
  if (!o.length || !d.length) throw new Error(`We couldn't find a station for “${!o.length ? s.from : s.to}”. Try a city, station name or code.`);
  const [nearO, nearD] = await Promise.all([p.getNearbyStations(o[0].code, 120), p.getNearbyStations(d[0].code, 120)]);
  const origins = new Map<string, NearbyStation | null>(o.map((x) => [x.code, null]));
  const dests = new Map<string, NearbyStation | null>(d.map((x) => [x.code, null]));
  nearO.filter((n) => n.distanceKm <= cfg.radius).forEach((n) => origins.set(n.station.code, n));
  nearD.filter((n) => n.distanceKm <= cfg.radius).forEach((n) => dests.set(n.station.code, n));

  const start = parseHM(s.departAfter), lo = start - cfg.before, hi = start + cfg.after;
  const stations = new Map<string, Station>(); const legCache = new Map<string, Promise<Raw[]>>();
  const stn = async (c: string) => stations.get(c) ?? (stations.set(c, (await p.getStation(c))!), stations.get(c)!);
  const legsFrom = (code: string) => {
    if (!legCache.has(code)) legCache.set(code, (async () => {
      const out: Raw[] = [];
      for (const t of await p.searchTrains({ station: code, date: s.date })) {
        const i = t.stops.findIndex((x) => x.station === code);
        for (let j = i + 1; j < t.stops.length; j++) out.push({ train: t, from: await stn(code), to: await stn(t.stops[j].station), dep: t.stops[i].dep, arr: t.stops[j].arr });
      }
      return out;
    })());
    return legCache.get(code)!;
  };

  let examined = 0, dropped = 0; const paths: Raw[][] = [];
  const dfs = async (at: string, path: Raw[], seen: Set<string>, used: Set<string>): Promise<void> => {
    for (const l of await legsFrom(at)) {
      if (used.has(l.train.number) || seen.has(l.to.code)) continue;      // no duplicate trains or loops
      if (!path.length && (l.dep < lo || l.dep > hi)) continue;
      if (path.length) {
        const prev = path[path.length - 1], gap = l.dep - prev.arr;
        if (gap < 0) continue;                                              // never negative transfer time
        if (gap < requiredTransfer(prev.to, s.minTransferMin)) { dropped++; continue; } // arrival + buffer <= departure
        if (gap > cfg.maxWait) continue;                                    // unreasonably long wait
      }
      examined++;
      if (dests.has(l.to.code)) paths.push([...path, l]);
      else if (path.length < cfg.maxChanges) await dfs(l.to.code, [...path, l], new Set(seen).add(l.to.code), new Set(used).add(l.train.number));
    }
  };
  for (const c of origins.keys()) await dfs(c, [], new Set([c]), new Set());

  const avCache = new Map<string, Promise<JourneySegment | null>>();
  const segment = (r: Raw) => {
    const k = `${r.train.number}${r.from.code}${r.to.code}`;
    if (!avCache.has(k)) avCache.set(k, (async () => {
      const cls = Object.keys(r.train.classes) as TravelClass[];
      if (s.travelClass !== "ANY" && !cls.includes(s.travelClass)) return null;
      const av = await Promise.all(cls.map((c) => p.getAvailability(r.train.number, r.from.code, r.to.code, s.date, c)));
      const classes: Partial<Record<TravelClass, Availability>> = Object.fromEntries(cls.map((c, i) => [c, av[i]]));
      const pick = s.travelClass !== "ANY" ? s.travelClass : cls.sort((a, b) => RANK[classes[a]!.status] - RANK[classes[b]!.status])[0];
      const fare = pick ? await p.getFare(r.train.number, r.from.code, r.to.code, pick, s.date) : null;
      return { trainNumber: r.train.number, trainName: r.train.name, trainType: r.train.type, from: r.from, to: r.to, dep: r.dep, arr: r.arr, travelClass: pick ?? null, classes, availability: pick ? classes[pick]! : { status: "UNKNOWN", source: "none" }, fare } as JourneySegment;
    })());
    return avCache.get(k)!;
  };

  const js: Journey[] = []; const ids = new Set<string>();
  for (const path of paths) {
    const id = path.map((l) => `${l.train.number}:${l.from.code}-${l.to.code}`).join("|");
    if (ids.has(id)) continue; ids.add(id);
    const segs = await Promise.all(path.map(segment)); if (segs.some((x) => !x)) continue;
    const sg = segs as JourneySegment[];
    const on = origins.get(path[0].from.code) ?? null, dn = dests.get(path[path.length - 1].to.code) ?? null;
    const transfers = path.slice(1).map((l, i) => ({ station: path[i].to, minutes: l.dep - path[i].arr, requiredMinutes: requiredTransfer(path[i].to, s.minTransferMin) }));
    const fares = sg.map((x) => x.fare?.amount);
    js.push({
      id, segments: sg, transfers, depart: path[0].dep, arrive: path[path.length - 1].arr, durationMin: path[path.length - 1].arr - path[0].dep,
      waitMin: transfers.reduce((a, t) => a + t.minutes, 0), changes: path.length - 1,
      status: sg.map((x) => x.availability.status).sort((a, b) => RANK[b] - RANK[a])[0],
      fareTotal: fares.every((f) => f != null) ? (fares as number[]).reduce((a, b) => a + b, 0) * s.passengers : null,
      originNearby: on, destNearby: dn, extraRoadMin: (on?.roadMinutes ?? 0) + (dn?.roadMinutes ?? 0), score: 0, scoreParts: [], tags: [],
      explanation: { summary: "", points: [] }, dataSource: p.isDemo ? "demo" : "live",
    });
  }
  scoreJourneys(js, s.preference, s.passengers);
  if (js.length) {
    js[0].tags.push("Best match");
    const add = (t: string, j?: Journey) => j && !j.tags.includes(t) && j.tags.push(t);
    add("Fastest", [...js].sort((a, b) => a.durationMin - b.durationMin)[0]);
    add("Cheapest", [...js].filter((j) => j.fareTotal != null).sort((a, b) => a.fareTotal! - b.fareTotal!)[0]);
    add("Fewest changes", [...js].sort((a, b) => a.changes - b.changes || a.durationMin - b.durationMin)[0]);
    add("Best availability", [...js].sort((a, b) => RANK[a.status] - RANK[b.status] || a.durationMin - b.durationMin)[0]);
    js.forEach((j) => (j.explanation = explain(j, js, s)));
  }
  const directSuitable = js.some((j) => j.changes === 0 && !j.originNearby && !j.destNearby && (j.status === "AVAILABLE" || j.status === "RAC"));
  return {
    search: s, journeys: js, examined, droppedTight: dropped, directSuitable, nearbyOrigin: nearO, nearbyDest: nearD, provider: { name: p.name, isDemo: p.isDemo },
    headline: directSuitable ? `${js.length} journey option${js.length === 1 ? "" : "s"} found` : js.length ? "No suitable direct option found. Here are alternative journeys we found." : "We couldn't find a practical journey with the current flexibility settings.",
  };
}
