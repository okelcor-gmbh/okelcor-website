import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const res = await fetch(`${BASE}/customers/${id}/data-quality/recalculate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.status });
  } catch { return NextResponse.json({ error: "Network error" }, { status: 502 }); }
}
