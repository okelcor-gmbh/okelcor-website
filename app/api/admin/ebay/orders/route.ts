import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

async function adminToken() {
  const s = await cookies();
  return s.get("admin_token")?.value ?? null;
}

export async function GET(req: NextRequest) {
  const tk = await adminToken();
  if (!tk) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const upstream = new URL(`${BASE}/ebay/orders`);
  searchParams.forEach((v, k) => upstream.searchParams.set(k, v));

  try {
    const res = await fetch(upstream.toString(), {
      headers: { Authorization: `Bearer ${tk}`, Accept: "application/json" },
      cache: "no-store",
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ message: "Network error" }, { status: 502 });
  }
}
