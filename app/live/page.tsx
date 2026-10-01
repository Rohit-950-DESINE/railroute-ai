"use client";
import { useState } from "react";

export default function Live() {
  const [n, setN] = useState(""); const [r, setR] = useState<{ available: boolean; message: string | null; live: Record<string, string | number> | null } | null>(null);
  async function go(e: React.FormEvent) { e.preventDefault(); setR(await (await fetch(`/api/live?train=${encodeURIComponent(n)}`)).json()); }
  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-10">
      <h1 className="text-3xl font-extrabold">Live Train Status</h1>
      <p className="muted mt-1">Real-time data appears here only when a live provider is connected. It is never simulated.</p>
      <form onSubmit={go} className="mt-6 flex gap-2"><input className="field" aria-label="Train number" placeholder="Train number" value={n} onChange={(e) => setN(e.target.value)} required /><button className="btn">Check</button></form>
      {r && (
        <div className="card mt-5 p-5">
          {!r.available && <p className="font-semibold" style={{ color: "var(--warn)" }}>{r.message}</p>}
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{["Train number", "Train name", "Current station", "Next station", "Expected arrival", "Delay"].map((k) => <div key={k}><dt className="lbl !mb-0">{k.toUpperCase()}</dt><dd className="font-semibold">{r.live ? String(r.live[k.toLowerCase().replace(/ (\w)/g, (_, c) => c.toUpperCase()).replace("trainNumber", "trainNumber")] ?? "—") : "—"}</dd></div>)}</dl>
        </div>
      )}
    </main>
  );
}
