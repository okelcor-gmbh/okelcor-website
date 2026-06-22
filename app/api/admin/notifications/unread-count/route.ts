/**
 * CRM-3B: Lightweight unread-count poll for the notifications bell.
 * GET → GET /admin/notifications/unread-count
 * Returns: { unread_count: number }
 *
 * Graceful: returns 0 if endpoint unavailable (backend not deployed yet).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET() {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ unread_count: 0 }, { status: 200 });

  try {
    const res = await fetch(`${BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ unread_count: 0 }, { status: 200 });
    const json = await res.json().catch(() => ({ unread_count: 0 }));
    return NextResponse.json({ unread_count: json.unread_count ?? 0 }, { status: 200 });
  } catch {
    return NextResponse.json({ unread_count: 0 }, { status: 200 });
  }
}
