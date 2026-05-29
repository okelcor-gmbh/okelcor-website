/**
 * CRM-3: Pipeline summary counts for the quotes overview page.
 * GET → GET /admin/quote-requests/summary
 * Returns:
 *   { new_count, needs_review_count, qualified_count, proposal_sent_count,
 *     follow_up_due_count, unassigned_count, high_priority_count, spam_count }
 *
 * Graceful: returns {} on any error so the page doesn't break if not yet deployed.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET() {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({}, { status: 200 }); // graceful — summary is non-critical

  try {
    const res = await fetch(`${BASE}/quote-requests/summary`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({}, { status: 200 });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json.data ?? json, { status: 200 });
  } catch {
    return NextResponse.json({}, { status: 200 });
  }
}
