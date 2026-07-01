/**
 * GET /api/admin/marketing-contacts/stats
 * → GET /admin/marketing-contacts/stats
 * Returns: { total, subscribed, unsubscribed, unknown }
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

const EMPTY = { total: 0, subscribed: 0, unsubscribed: 0, unknown: 0 };

export async function GET() {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json(EMPTY, { status: 200 });

  try {
    const res = await fetch(`${BASE}/marketing-contacts/stats`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json(EMPTY, { status: 200 });
    const json = await res.json().catch(() => EMPTY);
    return NextResponse.json(json?.data ?? json, { status: 200 });
  } catch {
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
