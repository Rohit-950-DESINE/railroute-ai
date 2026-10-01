import { NextResponse } from "next/server";
import { getProvider } from "@/lib/providers";

export async function GET(req: Request) {
  const n = new URL(req.url).searchParams.get("train")?.trim();
  if (!n) return NextResponse.json({ error: "Enter a train number." }, { status: 400 });
  const p = getProvider(); const live = await p.getLiveStatus(n);
  return NextResponse.json({ available: !!live, live, demo: p.isDemo, message: live ? null : "Live data unavailable — demo mode" });
}
