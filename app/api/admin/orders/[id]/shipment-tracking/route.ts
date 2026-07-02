/**
 * Admin — live carrier shipment tracking (GLS / DHL / ocean freight incl. Maersk).
 * GET → GET /admin/orders/{id}/shipment-tracking   (permission: tracking.view)
 * Unlike the customer endpoint (persisted, hourly-refreshed), this calls the
 * carrier API live and persists any new events — "I need this right now".
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json({ data: null }, { status: 401 });

  try {
    const res = await fetch(`${BASE}/orders/${id}/shipment-tracking`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { data: null, message: (json as { message?: string }).message ?? "Couldn't fetch shipment tracking." },
        { status: res.status }
      );
    }
    return NextResponse.json({ data: json.data ?? json }, { status: 200 });
  } catch {
    return NextResponse.json({ data: null, message: "Network error — please try again." }, { status: 502 });
  }
}
