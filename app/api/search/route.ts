import { NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";
import { searchJourneys } from "@/lib/engine";
import type { RouteSearch } from "@/lib/types";

export async function POST(req: Request) {
  const s = (await req.json().catch(() => null)) as RouteSearch | null;
  if (!s?.from || !s?.to || !s.date) return NextResponse.json({ error: "Please enter From, To and a date." }, { status: 400 });
  try {
    return NextResponse.json(await searchJourneys(getProvider(), s));
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: msg.startsWith("We couldn") ? msg : "Railway data provider is temporarily unavailable." }, { status: msg.startsWith("We couldn") ? 404 : 503 });
  }
}
