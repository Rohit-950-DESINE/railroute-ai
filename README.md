# RailRoute AI — frontend MVP (Next.js 16, App Router, TypeScript, Tailwind)

Works with zero API keys using clearly labelled DEMO data.

    npm install
    npm run dev        # http://localhost:3000   (Node 20.9+)

Where things live: `lib/providers/types.ts` (RailwayProvider interface) · `lib/providers/mock.ts` (demo data) · `lib/providers/index.ts` (swap in a real provider, server-side) ·
`lib/engine.ts` (graph search + connection rules) · `lib/scoring.ts` (weights + explanations) · `lib/nlu.ts` / `lib/assistant.ts` (rule-based now, LLM later via a server route) ·
`app/api/*` (server routes; keys stay in env, never NEXT_PUBLIC_) · `db/schema.sql` (PostgreSQL, optional).

Try: Jammu → Ludhiana, 08:00. Strict = no result (empty state). Balanced = alternatives + nearby station + a rejected tight connection. Flexible = adds the direct night train and a via-Delhi route.
