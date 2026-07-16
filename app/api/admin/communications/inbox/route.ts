import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

export async function GET(request: NextRequest) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return NextResponse.json({ data: [], meta: { unread_count: 0 } });

  const url = new URL(`${BASE}/communications/inbox`);
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({ data: [], meta: { unread_count: 0 } }));
    return NextResponse.json(json, { status: res.ok ? res.status : 200 });
  } catch {
    return NextResponse.json({ data: [], meta: { unread_count: 0 } });
  }
}
