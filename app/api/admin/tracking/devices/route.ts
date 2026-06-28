/**
 * Admin tracking — list devices + their latest position (powers map + list).
 * GET → GET /admin/tracking/devices
 * Graceful: empty list if unauthenticated or unavailable.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

const EMPTY = { data: [], meta: { total: 0 } };

export async function GET() {
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json(EMPTY, { status: 200 });

  try {
    const res = await fetch(`${BASE}/tracking/devices`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json(EMPTY, { status: 200 });
    const json = await res.json().catch(() => EMPTY);
    return NextResponse.json(
      { data: json.data ?? [], meta: json.meta ?? { total: (json.data ?? []).length } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
