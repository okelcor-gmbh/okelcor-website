import { NextResponse } from "next/server";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";
const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;
export async function GET() {
  const tk = (await cookies()).get("admin_token")?.value;
  if (!tk) return NextResponse.json({}, { status: 200 });
  try {
    const res = await fetch(`${BASE}/customers/data-quality/summary`, {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({}, { status: 200 });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json.data ?? json);
  } catch { return NextResponse.json({}, { status: 200 }); }
}
