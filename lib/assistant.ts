import type { SearchOutcome } from "./types";
import { fmtDur, fmtTime, inr } from "./format";

export type SortKey = "recommended" | "fastest" | "cheapest" | "wait";
export interface Action { maxChanges?: number; arriveBy?: number; sort?: SortKey }
const NO_DATA = "I don't have verified live data for this detail.";

/** Answers only from the current search results. Deterministic, so it cannot invent schedules, fares or rules. */
export function ask(q: string, o: SearchOutcome): { text: string; action?: Action } {
  const t = q.toLowerCase(), js = o.journeys;
  if (!js.length) return { text: "There are no journeys in the current results. Try expanding the flexibility setting first." };
  const top = js[0];
  if (/(max|maximum|at most|only|not more than|no more than).*(one|1) change|one change/.test(t)) {
    const n = js.filter((j) => j.changes <= 1).length; return { text: `Showing ${n} option${n === 1 ? "" : "s"} with at most one change.`, action: { maxChanges: 1 } };
  }
  const by = t.match(/before\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (by) {
    let h = +by[1]; if (by[3] === "pm" && h < 12) h += 12; if (by[3] === "am" && h === 12) h = 0;
    const lim = h * 60 + +(by[2] ?? 0), ok = js.filter((j) => j.arrive <= lim);
    return { text: ok.length ? `${ok.length} option${ok.length === 1 ? " reaches" : "s reach"} before ${fmtTime(lim)}. The earliest arrives at ${fmtTime(Math.min(...ok.map((j) => j.arrive)))}.` : `None of the current options arrive before ${fmtTime(lim)}. Try Flexible mode or an earlier departure time.`, action: { arriveBy: lim } };
  }
  if (/cheap|lower.?cost|budget/.test(t)) {
    const priced = js.filter((j) => j.fareTotal != null).sort((a, b) => a.fareTotal! - b.fareTotal!);
    return priced.length ? { text: `The lowest fare found is ${inr(priced[0].fareTotal)} (${o.provider.isDemo ? "demo fare" : "provider fare"}), ${priced[0].changes} change(s), ${fmtDur(priced[0].durationMin)}. Sorted by price.`, action: { sort: "cheapest" } } : { text: NO_DATA };
  }
  if (/wait/.test(t)) { const j = [...js].sort((a, b) => a.waitMin - b.waitMin)[0]; return { text: j.waitMin ? `The shortest total waiting is ${fmtDur(j.waitMin)}.` : "There's a direct option with no waiting.", action: { sort: "wait" } }; }
  if (/nearby|another station|other station/.test(t)) {
    const used = js.filter((j) => j.originNearby || j.destNearby);
    return { text: used.length ? `${used.length} option(s) use a nearby station: ${[...new Set(used.flatMap((j) => [j.originNearby?.station.name, j.destNearby?.station.name]).filter(Boolean))].join(", ")}. Each card shows the distance and road time. Check boarding rules before booking.` : "No current option uses a nearby station. Switch to Balanced or Flexible to include them." };
  }
  if (/why/.test(t)) return { text: `${top.explanation.summary} ${top.explanation.points.join(" ")}` };
  return { text: NO_DATA + " I can help with changes, arrival time, price, waiting, nearby stations, or why a route was suggested." };
}
