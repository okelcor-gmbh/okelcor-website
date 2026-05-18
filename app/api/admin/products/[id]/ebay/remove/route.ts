import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${id}/ebay/remove`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ebay/remove] network error for product ${id}: ${msg}`);
    return NextResponse.json(
      { error: `Could not reach API server — ${msg}` },
      { status: 502 }
    );
  }

  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    console.error(
      `[ebay/remove] backend non-JSON response (HTTP ${res.status}) for product ${id}:`,
      text.slice(0, 500)
    );
    return NextResponse.json(
      { error: `eBay remove failed — backend returned HTTP ${res.status}. Check server logs.` },
      { status: res.status }
    );
  }

  if (!res.ok) {
    console.error(`[ebay/remove] backend error (HTTP ${res.status}) for product ${id}:`, JSON.stringify(json));
  }

  return NextResponse.json(json, { status: res.ok ? 200 : res.status });
}
