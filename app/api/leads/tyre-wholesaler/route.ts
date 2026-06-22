/**
 * Tyre Wholesaler landing lead — proxy to the backend CRM endpoint.
 * POST → POST /leads/tyre-wholesaler  (public, backend throttle:quote-form 5/hr)
 *
 * Forwards the real client IP (X-Forwarded-For / X-Real-IP) so the backend's
 * per-IP rate limit buckets by visitor, not by this proxy's address.
 *
 * Pass-through responses:
 *   201 → { data: { ref_number, message, review_status } }
 *   422 → { message, code: "low_quality_inquiry", flags }  (CRM-2) or Laravel validation errors
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  const xff = request.headers.get("x-forwarded-for");
  const xri = request.headers.get("x-real-ip");

  let data: unknown;
  let status: number;
  try {
    const res = await fetch(`${API_URL}/leads/tyre-wholesaler`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(xff ? { "X-Forwarded-For": xff } : {}),
        ...(xri ? { "X-Real-IP": xri } : {}),
      },
      body: JSON.stringify(body),
    });
    data = await res.json().catch(() => ({}));
    status = res.status;
  } catch {
    return NextResponse.json(
      { message: "Could not reach the lead service. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json(data, { status });
}
