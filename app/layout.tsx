import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "RailRoute AI — Don't just find a train. Find the journey.", description: "AI-powered railway journey planner: direct trains, connections, nearby stations and practical alternatives." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nav: [string, string][] = [["Home", "/"], ["Plan Journey", "/#plan"], ["Live Trains", "/live"], ["How It Works", "/#how"]];
  return (
    <html lang="en"><body>
      <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 85%, transparent)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: "var(--brand)" }} aria-hidden>➜</span>RailRoute <span style={{ color: "var(--brand)" }}>AI</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-semibold md:flex">
            {nav.map(([l, h]) => <Link key={l} href={h} className="muted hover:opacity-80">{l}</Link>)}
            <span className="muted opacity-50" title="Needs authentication (Phase 2)">My Trips</span>
          </nav>
          <div className="flex items-center gap-2">
            <span className="pill s-WAITLIST text-[11px]" title="Fictional data. Not for real travel.">Demo Data</span>
            <button className="ghost" disabled title="Authentication arrives in Phase 2">Login / Sign Up</button>
          </div>
        </div>
      </header>
      {children}
    </body></html>
  );
}
