import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;
export async function GET(req: NextRequest) {
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json({ data: [] });
  const qs = req.nextUrl.searchParams.toString();
  try {
    const res = await fetch(`${BASE}/crm/follow-ups${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({ data: [], meta: {} }));
    return NextResponse.json(json, { status: res.ok ? res.status : 200 });
  } catch { return NextResponse.json({ data: [], meta: {} }); }
}
