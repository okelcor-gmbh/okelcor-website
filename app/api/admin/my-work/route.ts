/**
 * CRM-3B: Actionable work queue for the logged-in admin.
 * GET → GET /admin/my-work
 * Returns: { data: MyWorkItem[] }
 *
 * Graceful: returns empty list if endpoint unavailable (backend not deployed yet).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET() {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ data: [] }, { status: 200 });

  try {
    const res = await fetch(`${BASE}/my-work`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ data: [] }, { status: 200 });
    const json = await res.json().catch(() => ({ data: [] }));
    return NextResponse.json({ data: json.data ?? [] }, { status: 200 });
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
}
