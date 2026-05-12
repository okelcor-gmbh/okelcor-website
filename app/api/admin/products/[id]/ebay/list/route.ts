import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { listProductOnEbay, type EbayProduct } from "@/lib/ebay";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;

  // ── 1. Fetch product from backend ──────────────────────────────────────────
  let product: EbayProduct;
  try {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });
    if (!res.ok) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const json = await res.json().catch(() => ({})) as { data?: EbayProduct } & EbayProduct;
    product = json.data ?? json;

    if (!product?.id) return NextResponse.json({ error: "Could not load product data." }, { status: 422 });
  } catch (err) {
    console.error(`[ebay/list] fetch product ${id}:`, err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Could not reach API server." }, { status: 502 });
  }

  // ── 2. List on eBay ────────────────────────────────────────────────────────
  const { itemId, error } = await listProductOnEbay(product);

  if (error) {
    return NextResponse.json({ error }, { status: 422 });
  }

  // ── 3. Update backend: mark product as listed ──────────────────────────────
  try {
    await fetch(`${API_URL}/admin/products/${id}`, {
      method: "PATCH",
      headers: {
        Authorization:  `Bearer ${token}`,
        Accept:         "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ebay_listed:  true,
        ...(itemId ? { ebay_item_id: itemId } : {}),
      }),
      cache: "no-store",
    });
  } catch (err) {
    // Log but don't fail — listing is live on eBay regardless
    console.error(`[ebay/list] backend PATCH failed for product ${id}:`, err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({ ok: true, itemId: itemId ?? null, message: "Listed on eBay successfully." });
}
