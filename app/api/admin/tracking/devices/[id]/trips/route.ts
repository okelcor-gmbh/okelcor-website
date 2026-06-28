/**
 * Admin tracking — trips for a device.
 * GET → GET /admin/tracking/devices/{id}/trips?from=&to=   (defaults last 24h)
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

const EMPTY = { data: [], meta: { from: null, to: null, total: 0 } };

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json(EMPTY, { status: 200 });

  const qs = new URLSearchParams();
  for (const key of ["from", "to"]) {
    const v = req.nextUrl.searchParams.get(key);
    if (v) qs.set(key, v);
  }
  const query = qs.toString();

  try {
    const res = await fetch(`${BASE}/tracking/devices/${id}/trips${query ? `?${query}` : ""}`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json(EMPTY, { status: 200 });
    const json = await res.json().catch(() => EMPTY);
    return NextResponse.json({ data: json.data ?? [], meta: json.meta ?? EMPTY.meta }, { status: 200 });
  } catch {
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
