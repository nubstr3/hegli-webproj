import { NextResponse } from "next/server";

// Deliberately tiny — this exists only so the status bar can measure a
// real round-trip time to the server. No-store so the browser/CDN never
// serves a cached response, which would make the timing meaningless.
export async function GET() {
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}