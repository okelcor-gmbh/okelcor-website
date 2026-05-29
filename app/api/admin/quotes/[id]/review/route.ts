/**
 * CRM-2: Admin inquiry review actions
 * POST { action: "qualify" | "reject" | "spam", reason?: string }
 * → POST /admin/quote-requests/{id}/review
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

const VALID_ACTIONS = new Set(["qualify", "reject", "spam"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body: { action?: string; reason?: string } = await req.json().catch(() => ({}));

  if (!body.action || !VALID_ACTIONS.has(body.action)) {
    return NextResponse.json({ error: `Invalid action: ${body.action ?? "(missing)"}` }, { status: 400 });
  }

  try {
    const res = await fetch(`${BASE}/quote-requests/${id}/review`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tk}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ action: body.action, reason: body.reason ?? null }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}
