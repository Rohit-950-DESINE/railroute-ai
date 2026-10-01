"use client";
import { useState } from "react";
import { ask, type Action } from "@/lib/assistant";
import type { SearchOutcome } from "@/lib/types";

const IDEAS = ["Find me a route with maximum one change.", "Can I reach before 6 PM?", "Show cheaper alternatives.", "Which option has the least waiting?", "Can I use a nearby station?", "Why did you suggest this route?"];
export default function AssistantPanel({ o, onAction }: { o: SearchOutcome; onAction: (a: Action) => void }) {
  const [log, setLog] = useState<{ q: string; a: string }[]>([]); const [q, setQ] = useState("");
  const send = (text: string) => { if (!text.trim()) return; const r = ask(text, o); r.action && onAction(r.action); setLog((l) => [...l, { q: text, a: r.text }]); setQ(""); };
  return (
    <aside className="card p-4" aria-label="AI assistant">
      <h3 className="font-extrabold">Journey assistant</h3>
      <p className="muted text-xs">Answers only from your current results. Never invents schedules, fares or rules.</p>
      <div className="mt-3 max-h-72 space-y-3 overflow-y-auto text-sm" aria-live="polite">
        {log.map((m, i) => <div key={i}><p className="font-semibold">{m.q}</p><p className="muted">{m.a}</p></div>)}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">{IDEAS.slice(0, log.length ? 3 : 6).map((i) => <button key={i} className="chip text-xs" onClick={() => send(i)}>{i}</button>)}</div>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(q); }}>
        <input className="field" aria-label="Ask about your journey" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about these results…" />
        <button className="btn !px-4">Ask</button>
      </form>
    </aside>
  );
}
