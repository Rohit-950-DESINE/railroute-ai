import type { AvailabilityStatus, Journey, Preference, RouteExplanation, RouteSearch, ScorePart } from "./types";
import { fmtDur } from "./format";

export const RANK: Record<AvailabilityStatus, number> = { AVAILABLE: 0, RAC: 1, WAITLIST: 2, UNKNOWN: 2.5, NOT_AVAILABLE: 3 };
type W = { time: number; wait: number; changes: number; fare: number; availability: number; walking: number; distance: number };
const BASE: W = { time: 1, wait: 1, changes: 30, fare: 0.05, availability: 25, walking: 2, distance: 0.3 };
// Weights change with the user's preference; there is no single universal "best".
const PREF: Record<Preference, Partial<W>> = {
  best: { wait: 1.2, changes: 35 }, fastest: { time: 3, wait: 0.3, changes: 10, availability: 5, fare: 0 },
  cheapest: { fare: 0.6, time: 0.2, wait: 0.2, changes: 10 }, fewest_changes: { changes: 120 },
  availability: { availability: 90 }, least_walking: { walking: 3, distance: 0.5 }, comfortable: { changes: 60, wait: 1.5, walking: 1.5 },
};
const ROAD_FALLBACK_FARE = 600;

export function scoreJourneys(js: Journey[], pref: Preference, pax: number) {
  const w = { ...BASE, ...PREF[pref] };
  for (const j of js) {
    const v: W = { time: j.durationMin, wait: j.waitMin, changes: j.changes, fare: j.fareTotal ?? ROAD_FALLBACK_FARE * pax, availability: RANK[j.status], walking: j.extraRoadMin, distance: (j.originNearby?.distanceKm ?? 0) + (j.destNearby?.distanceKm ?? 0) };
    const parts: ScorePart[] = (Object.keys(v) as (keyof W)[]).map((k) => ({ factor: k, value: v[k], weight: w[k], contribution: Math.round(v[k] * w[k] * 10) / 10 }));
    j.scoreParts = parts.filter((p) => p.weight > 0);
    j.score = Math.round(parts.reduce((a, p) => a + p.contribution, 0) * 10) / 10;
  }
  js.sort((a, b) => a.score - b.score || a.durationMin - b.durationMin);
}

/** Explanations are built only from computed route data. */
export function explain(j: Journey, all: Journey[], s: RouteSearch): RouteExplanation {
  const pts: string[] = [];
  const direct = all.filter((x) => x.changes === 0 && !x.originNearby && !x.destNearby && (x.status === "AVAILABLE" || x.status === "RAC")).sort((a, b) => a.durationMin - b.durationMin)[0];
  const fastest = [...all].sort((a, b) => a.durationMin - b.durationMin)[0];
  if (j.changes === 0) pts.push("Direct train with no changes.");
  else pts.push(j.transfers.map((t) => `${t.minutes}-minute connection at ${t.station.name} (minimum ${t.requiredMinutes} min required)`).join("; ") + ".");
  if (j.originNearby) pts.push(`Boards at ${j.originNearby.station.name}, about ${j.originNearby.distanceKm} km (~${j.originNearby.roadMinutes} min by road) from ${s.from}. Your ticket would start there.`);
  if (j.destNearby) pts.push(`Ends at ${j.destNearby.station.name}, about ${j.destNearby.distanceKm} km (~${j.destNearby.roadMinutes} min by road) from ${s.to}.`);
  const ref = direct ?? null;
  if (ref && ref !== j) { const d = ref.arrive - j.arrive; pts.push(d > 0 ? `Arrives ${fmtDur(d)} earlier than the best direct option.` : d < 0 ? `Arrives ${fmtDur(-d)} later than the best direct option.` : "Arrives at the same time as the best direct option."); }
  if (j !== fastest) pts.push(`${fmtDur(j.durationMin - fastest.durationMin)} longer than the fastest option found.`);
  else if (all.length > 1) pts.push("Shortest total journey time found.");
  const label = { AVAILABLE: "currently shown as available", RAC: "currently shown as RAC", WAITLIST: "currently shown as waitlisted", NOT_AVAILABLE: "currently shown as not available", UNKNOWN: "unknown (no verified availability source)" }[j.status];
  pts.push(`Availability is ${label}${j.dataSource === "demo" ? " (demo data)" : ""}.`);
  return { summary: `${j.changes} change${j.changes === 1 ? "" : "s"}, ${fmtDur(j.durationMin)}. Ranked using your “${s.preference.replace("_", " ")}” preference.`, points: pts };
}
