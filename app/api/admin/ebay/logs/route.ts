import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  // Forward all supported filter params to the backend
  const incoming = req.nextUrl.searchParams;
  const params = new URLSearchParams();
  for (const key of ["product_id", "sku", "action", "status", "from", "to", "page", "per_page"]) {
    const val = incoming.get(key);
    if (val) params.set(key, val);
  }

  try {
    const res = await fetch(`${API_URL}/admin/ebay/logs?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ error: "Could not reach API server." }, { status: 502 });
  }
}
