/**
 * CRM-3 / CRM-3B: List in-app notifications for the current admin user.
 * GET → GET /admin/notifications
 * Forwards filters: unread=1, type, severity, page
 * Returns: { data: AdminNotification[], unread_count: number, meta? }
 *
 * Graceful: returns empty list if endpoint unavailable (backend not deployed yet).
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

const ALLOWED = ["unread", "type", "severity", "page", "per_page"] as const;

export async function GET(req: NextRequest) {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ data: [], unread_count: 0 }, { status: 200 });

  const incoming = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  for (const key of ALLOWED) {
    const v = incoming.get(key);
    if (v) qs.set(key, v);
  }
  const query = qs.toString();

  try {
    const res = await fetch(`${BASE}/notifications${query ? `?${query}` : ""}`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ data: [], unread_count: 0 }, { status: 200 });
    const json = await res.json().catch(() => ({ data: [], unread_count: 0 }));
    return NextResponse.json(
      { data: json.data ?? [], unread_count: json.unread_count ?? 0, meta: json.meta ?? null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ data: [], unread_count: 0 }, { status: 200 });
  }
}
