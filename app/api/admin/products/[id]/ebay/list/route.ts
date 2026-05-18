import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;

  try {
    const res = await fetch(`${API_URL}/admin/products/${id}/ebay/list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    return NextResponse.json(json, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error(
      `[ebay/list] proxy error for product ${id}:`,
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json({ error: "Could not reach API server." }, { status: 502 });
  }
}
