/**
 * Admin tracking — Traccar connection status (for the banner).
 * GET → GET /admin/tracking/status
 * Graceful: reports not-configured/disconnected if unauthenticated or unavailable.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

const OFFLINE = { configured: false, connected: false, message: "Tracking is not available." };

export async function GET() {
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json(OFFLINE, { status: 200 });

  try {
    const res = await fetch(`${BASE}/tracking/status`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json(OFFLINE, { status: 200 });
    const json = await res.json().catch(() => OFFLINE);
    return NextResponse.json(json.data ?? json ?? OFFLINE, { status: 200 });
  } catch {
    return NextResponse.json(OFFLINE, { status: 200 });
  }
}
