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

  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${id}/ebay/list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ebay/list] network error for product ${id}: ${msg}`);
    return NextResponse.json(
      { error: `Could not reach API server — ${msg}` },
      { status: 502 }
    );
  }

  // Read as text first so we handle both JSON and non-JSON backend responses
  const text = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Backend returned a non-JSON body (nginx error page, etc.)
    console.error(
      `[ebay/list] backend non-JSON response (HTTP ${res.status}) for product ${id}:`,
      text.slice(0, 500)
    );
    return NextResponse.json(
      { error: `eBay listing failed — backend returned HTTP ${res.status}. Check server logs.` },
      { status: res.status }
    );
  }

  if (!res.ok) {
    // Log the full backend error so it appears in Next.js server logs
    console.error(`[ebay/list] backend error (HTTP ${res.status}) for product ${id}:`, JSON.stringify(json));
  }

  return NextResponse.json(json, { status: res.ok ? 200 : res.status });
}
