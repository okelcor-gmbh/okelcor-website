/**
 * GET /api/admin/bulk-emails/[id]
 * → GET /admin/bulk-emails/{id}
 * Returns full campaign detail including body_html (used for progress polling).
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;

  try {
    const res = await fetch(`${BASE}/bulk-emails/${id}`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return NextResponse.json(json, { status: res.status });
    }

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Could not reach the API server." }, { status: 502 });
  }
}
