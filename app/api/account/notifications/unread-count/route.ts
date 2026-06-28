/**
 * Customer notifications — lightweight unread-count poll for the navbar bell.
 * GET → GET /auth/customer/notifications/unread-count
 * Returns: { unread_count: number }
 *
 * Graceful: returns { unread_count: 0 } (200) when unauthenticated or the
 * backend endpoint is unavailable.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function GET() {
  const store = await cookies();
  const token = store.get("customer_token")?.value;
  if (!token) return NextResponse.json({ unread_count: 0 }, { status: 200 });

  try {
    const res = await fetch(`${API_URL}/auth/customer/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ unread_count: 0 }, { status: 200 });
    const json = await res.json().catch(() => ({ unread_count: 0 }));
    return NextResponse.json({ unread_count: json.unread_count ?? 0 }, { status: 200 });
  } catch {
    return NextResponse.json({ unread_count: 0 }, { status: 200 });
  }
}
