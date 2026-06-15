/**
 * CRM-3: List in-app notifications for the current admin user (e.g. "lead assigned to you").
 * GET → GET /admin/notifications
 * Returns: { data: AdminNotification[], unread_count: number }
 *
 * Graceful: returns empty list if endpoint unavailable (backend not deployed yet).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET() {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ data: [], unread_count: 0 }, { status: 200 });

  try {
    const res = await fetch(`${BASE}/notifications`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ data: [], unread_count: 0 }, { status: 200 });
    const json = await res.json().catch(() => ({ data: [], unread_count: 0 }));
    return NextResponse.json(
      { data: json.data ?? [], unread_count: json.unread_count ?? 0 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ data: [], unread_count: 0 }, { status: 200 });
  }
}
