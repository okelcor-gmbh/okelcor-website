/**
 * /api/admin/insights
 * Proxies GET /admin/insights — AI-generated admin insight cards.
 * See docs/BACKEND_NOTE_ai_insights.md. Backend endpoint doesn't exist yet;
 * this degrades to an empty list (not an error) until it does.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

const EMPTY = { data: [], generated_at: null, next_refresh_at: null };

export async function GET() {
  const store = await cookies();
  const tk = store.get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${BASE}/insights`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (res.status === 404 || res.status === 405) {
      return NextResponse.json(EMPTY);
    }

    const json = await res.json().catch(() => null);
    if (!json || !Array.isArray(json.data)) return NextResponse.json(EMPTY);
    return NextResponse.json(json, { status: res.status });
  } catch {
    return NextResponse.json(EMPTY);
  }
}
