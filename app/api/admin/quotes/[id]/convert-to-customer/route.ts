/**
 * CRM-3: Convert a qualified lead to a customer account.
 * POST { onboarding_action: "invite" | "approve" | "pending_review" }
 * → POST /admin/quote-requests/{id}/convert-to-customer
 *
 * Backend behavior:
 * - Checks if customer exists by email
 * - Creates customer with the specified onboarding_action
 * - Links quote to the new/existing customer
 * - Logs lead_converted_to_customer
 * - Returns { customer_id, customer_exists, onboarding_status, message }
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${BASE}/quote-requests/${id}/convert-to-customer`, {
      method: "POST",
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
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
