/**
 * Customer delivery tracking — live position + recent trail for the customer's own order.
 * GET → GET /auth/orders/{ref}/tracking   (customer bearer; always 200, two shapes)
 * Graceful: { available: false } when unauthenticated or unavailable.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

const UNAVAILABLE = { data: { available: false, reason: "unavailable" } };

export async function GET(_req: Request, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const token = (await cookies()).get("customer_token")?.value;
  if (!token) return NextResponse.json(UNAVAILABLE, { status: 200 });

  try {
    const res = await fetch(`${API_URL}/auth/orders/${ref}/tracking`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    // 404 = not the customer's order; treat as simply unavailable for the UI.
    if (!res.ok) return NextResponse.json(UNAVAILABLE, { status: 200 });
    const json = await res.json().catch(() => UNAVAILABLE);
    return NextResponse.json({ data: json.data ?? json ?? UNAVAILABLE.data }, { status: 200 });
  } catch {
    return NextResponse.json(UNAVAILABLE, { status: 200 });
  }
}
