// DEMO DATA — NOT FOR REAL TRAVEL. Fictional trains, availability and fares. Station names are real; distances are rough.
import type { AvailabilityStatus as A, NearbyStation, Station, Train, TravelClass } from "@/lib/types";
import type { RailwayProvider } from "./types";

const S = (code: string, name: string, city: string, o: Partial<Station> = {}): Station => ({ code, name, city, ...o });
const STATIONS = [
  S("JAT", "Jammu Tawi", "Jammu"), S("VJPR", "Vijaypur Jammu", "Vijaypur"), S("PTK", "Pathankot Cantt", "Pathankot"),
  S("UMB", "Ambala Cantt", "Ambala", { major: true }), S("JUC", "Jalandhar City", "Jalandhar"), S("LDH", "Ludhiana Jn", "Ludhiana", { major: true }),
  S("KNA", "Khanna", "Khanna"), S("NDLS", "New Delhi", "Delhi", { major: true, complex: true }),
];
const byCode = Object.fromEntries(STATIONS.map((s) => [s.code, s]));
const NEAR: Record<string, [string, number, number, string][]> = {
  JAT: [["VJPR", 30, 50, "Smaller station south of Jammu"], ["PTK", 100, 130, "Major junction, long road transfer"]],
  LDH: [["KNA", 45, 60, "Smaller station towards Ambala"], ["JUC", 60, 80, "Larger city, different direction"]],
};
const m = (s: string) => { const [t, d] = s.split("+"); const [h, mm] = t.split(":").map(Number); return h * 60 + mm + (d ? 1440 * Number(d) : 0); };
const T = (number: string, name: string, type: Train["type"], stops: [string, string][], classes: Train["classes"]): Train =>
  ({ number, name, type, stops: stops.map(([station, t]) => ({ station, arr: m(t), dep: m(t) })), classes });
const TRAINS: Train[] = [
  T("D1101", "Demo Tawi Superfast", "Superfast", [["JAT", "08:15"], ["UMB", "14:20"]], { SL: "AVAILABLE", "3A": "AVAILABLE", "2A": "RAC" }),
  T("D1202", "Demo Punjab Express", "Express", [["UMB", "15:30"], ["LDH", "17:05"]], { SL: "AVAILABLE", "3A": "RAC" }),
  T("D1204", "Demo Intercity", "Intercity", [["UMB", "14:50"], ["LDH", "16:20"]], { CC: "AVAILABLE" }),
  T("D1203", "Demo Khanna Link", "Local", [["UMB", "15:45"], ["KNA", "16:55"]], { "2S": "AVAILABLE" }),
  T("D1301", "Demo Dogra Express", "Express", [["JAT", "18:40"], ["PTK", "20:35"], ["JUC", "23:10"], ["LDH", "00:05+1"]], { SL: "NOT_AVAILABLE", "3A": "WAITLIST" }),
  T("D1401", "Demo Capital Link", "Superfast", [["JAT", "09:10"], ["NDLS", "19:30"]], { "3A": "AVAILABLE", "2A": "AVAILABLE" }),
  T("D1402", "Demo Delhi–Punjab Mail", "Express", [["NDLS", "21:10"], ["LDH", "01:20+1"]], { SL: "AVAILABLE", "3A": "RAC" }),
  T("D1502", "Demo Vijaypur Express", "Express", [["VJPR", "09:05"], ["LDH", "15:40"]], { SL: "AVAILABLE", "3A": "AVAILABLE" }),
  T("D1701", "Demo Dogra Passenger", "Local", [["JAT", "08:40"], ["PTK", "10:15"]], { "2S": "UNKNOWN" }),
  T("D1602", "Demo Pathankot Express", "Express", [["PTK", "11:30"], ["JUC", "14:00"], ["LDH", "15:10"]], { SL: "RAC", "3A": "AVAILABLE" }),
];
const RATE: Record<TravelClass, number> = { SL: 38, "3A": 95, "2A": 140, CC: 85, "2S": 22 };

export class MockRailwayProvider implements RailwayProvider {
  readonly name = "Demo data"; readonly isDemo = true;
  async searchStations(q: string) {
    const x = q.trim().toLowerCase(); if (!x) return [];
    const exact = STATIONS.filter((s) => [s.code, s.city, s.name].some((v) => v.toLowerCase() === x));
    return exact.length ? exact : STATIONS.filter((s) => s.name.toLowerCase().includes(x) || s.city.toLowerCase().includes(x));
  }
  async getStation(code: string) { return byCode[code] ?? null; }
  async getNearbyStations(code: string, radiusKm: number): Promise<NearbyStation[]> {
    return (NEAR[code] ?? []).filter((n) => n[1] <= radiusKm).map(([c, distanceKm, roadMinutes, note]) => ({ station: byCode[c], distanceKm, roadMinutes, note }));
  }
  async searchTrains({ station }: { station: string; date: string }) { return TRAINS.filter((t) => t.stops.some((s) => s.station === station)); }
  async getTrainSchedule(n: string) { return TRAINS.find((t) => t.number === n) ?? null; }
  async getAvailability(n: string, _f: string, _t: string, _d: string, cls: TravelClass) {
    const st: A | undefined = TRAINS.find((t) => t.number === n)?.classes[cls];
    return st ? { status: st, source: "demo" as const, checkedAt: new Date().toISOString() } : { status: "UNKNOWN" as const, source: "none" as const };
  }
  async getFare(n: string, f: string, to: string, cls: TravelClass) {
    const t = TRAINS.find((x) => x.number === n); const a = t?.stops.find((s) => s.station === f), b = t?.stops.find((s) => s.station === to);
    return a && b && t?.classes[cls] ? { amount: Math.round(((b.arr - a.dep) / 60) * RATE[cls]), currency: "INR" as const, source: "demo" as const } : null;
  }
  async getLiveStatus() { return null; } // never fake live tracking
}
