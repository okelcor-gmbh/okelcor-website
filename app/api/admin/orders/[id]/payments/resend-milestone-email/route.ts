import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const BASE = `${process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/admin`;

async function adminToken() {
  const s = await cookies();
  return s.get("admin_token")?.value ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const tk = await adminToken();
  if (!tk) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const text = await req.text();

  try {
    const res = await fetch(`${BASE}/orders/${id}/payments/resend-milestone-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tk}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: text || undefined,
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
