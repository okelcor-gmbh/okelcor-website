/**
 * Customer notification preferences — the customer's email/in-app delivery toggles.
 * GET → GET /auth/customer/notification-preferences
 * PUT → PUT /auth/customer/notification-preferences   body: CustomerNotificationPreferences
 *
 * Graceful: GET returns sensible defaults (everything on) when unauthenticated
 * or the backend endpoint is unavailable, so the preferences UI still renders.
 * Transactional groups (orders/payments/documents) default ON.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

const DEFAULTS = {
  inapp_enabled: true,
  email_enabled: true,
  email_orders: true,
  email_quotes: true,
  email_documents: true,
  email_account: true,
  email_marketing: false,
};

export async function GET() {
  const store = await cookies();
  const token = store.get("customer_token")?.value;
  if (!token) return NextResponse.json({ data: DEFAULTS }, { status: 200 });

  try {
    const res = await fetch(`${API_URL}/auth/customer/notification-preferences`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ data: DEFAULTS }, { status: 200 });
    const json = await res.json().catch(() => ({ data: DEFAULTS }));
    return NextResponse.json({ data: json.data ?? json ?? DEFAULTS }, { status: 200 });
  } catch {
    return NextResponse.json({ data: DEFAULTS }, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  const store = await cookies();
  const token = store.get("customer_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${API_URL}/auth/customer/notification-preferences`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
