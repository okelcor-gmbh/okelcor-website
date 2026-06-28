/**
 * Admin tracking — single device + latest position.
 * GET → GET /admin/tracking/devices/{id}
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json({ data: null }, { status: 200 });

  try {
    const res = await fetch(`${BASE}/tracking/devices/${id}`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ data: null }, { status: 200 });
    const json = await res.json().catch(() => ({ data: null }));
    return NextResponse.json({ data: json.data ?? null }, { status: 200 });
  } catch {
    return NextResponse.json({ data: null }, { status: 200 });
  }
}
