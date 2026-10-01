import type { Preference, RouteSearch } from "./types";

/** Rule-based parser (no keys needed). A backend LLM can replace this later; it must return the same structure. */
export function parseQuery(text: string, today = new Date()): { fields: Partial<RouteSearch>; missing: string[] } {
  const t = text.toLowerCase(), f: Partial<RouteSearch> = {};
  const m = t.match(/from\s+(.+?)\s+to\s+(.+?)(?=\s+(?:on|tomorrow|today|in the|this|at|before|after|by)\b|[,.]|$)/) ?? t.match(/^(.+?)\s+to\s+(.+?)(?=\s+(?:on|tomorrow|today|in the|this|at)\b|[,.]|$)/);
  const cap = (s: string) => s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  if (m) { f.from = cap(m[1].replace(/^(find me|show me)\s+(a\s+)?(cheap\s+|fast\s+)?(route|train)s?\s*/, "")); f.to = cap(m[2]); }
  const day = (n: number) => new Date(today.getTime() + n * 864e5).toISOString().slice(0, 10);
  if (/tomorrow/.test(t)) f.date = day(1); else if (/today/.test(t)) f.date = day(0);
  const part = { morning: "06:00", afternoon: "12:00", evening: "17:00", night: "20:00" } as const;
  for (const [k, v] of Object.entries(part)) if (t.includes(k)) f.departAfter = v;
  const pref: [RegExp, Preference][] = [[/cheap|budget/, "cheapest"], [/fastest|quick/, "fastest"], [/fewest|least change|one change/, "fewest_changes"], [/availab|confirmed/, "availability"], [/walking/, "least_walking"], [/comfort/, "comfortable"]];
  for (const [r, p] of pref) if (r.test(t)) { f.preference = p; break; }
  return { fields: f, missing: (["from", "to"] as const).filter((k) => !f[k]) };
}
