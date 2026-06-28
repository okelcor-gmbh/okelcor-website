/**
 * Admin tracking — assign / clear the tracking device a customer can track.
 * PUT → PUT /admin/tracking/orders/{orderId}/device   body: { tracking_device_id: "7" | null }
 * Requires orders.update (enforced server-side). Surfaces the real upstream status.
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function PUT(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${BASE}/tracking/orders/${orderId}/device`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${tk}`,
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
