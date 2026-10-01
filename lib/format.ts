export const parseHM = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
export const fmtTime = (m: number) => { const d = Math.floor(m / 1440), r = m % 1440; return `${String(Math.floor(r / 60)).padStart(2, "0")}:${String(r % 60).padStart(2, "0")}${d ? ` +${d}d` : ""}`; };
export const fmtDur = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
export const inr = (n: number | null) => (n == null ? "Fare unavailable" : `₹${n.toLocaleString("en-IN")}`);
