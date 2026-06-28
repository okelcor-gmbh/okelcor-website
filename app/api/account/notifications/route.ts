/**
 * Customer notifications — list the signed-in customer's in-app notifications.
 * GET → GET /auth/customer/notifications
 * Forwards filters: unread=1, type, page, per_page
 * Returns: { data: CustomerNotification[], unread_count: number, meta? }
 *
 * Graceful: returns an empty list (200) if the customer is unauthenticated or
 * the backend endpoint is not deployed yet, so the portal never hard-errors.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

const ALLOWED = ["unread", "type", "severity", "page", "per_page"] as const;

const EMPTY = { data: [], unread_count: 0, meta: null };

export async function GET(req: NextRequest) {
  const store = await cookies();
  const token = store.get("customer_token")?.value;
  if (!token) return NextResponse.json(EMPTY, { status: 200 });

  const incoming = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  for (const key of ALLOWED) {
    const v = incoming.get(key);
    if (v) qs.set(key, v);
  }
  const query = qs.toString();

  try {
    const res = await fetch(`${API_URL}/auth/customer/notifications${query ? `?${query}` : ""}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json(EMPTY, { status: 200 });
    const json = await res.json().catch(() => EMPTY);
    return NextResponse.json(
      { data: json.data ?? [], unread_count: json.unread_count ?? 0, meta: json.meta ?? null },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
