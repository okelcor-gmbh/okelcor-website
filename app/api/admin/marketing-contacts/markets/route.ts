/**
 * GET /api/admin/marketing-contacts/markets
 * → GET /admin/marketing-contacts/markets
 * Returns: { data: [{ market: string, contact_count: number }] }
 *
 * Auto-discovered from real contact data server-side (grouped by the
 * `market` column) — not a hardcoded list. Treat whatever this returns as
 * the canonical set of markets to populate pickers with.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET() {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ data: [] }, { status: 200 });

  try {
    const res = await fetch(`${BASE}/marketing-contacts/markets`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ data: [] }, { status: 200 });
    const json = await res.json().catch(() => ({ data: [] }));
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
