import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { removeProductFromEbay } from "@/lib/ebay";

export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { id } = await params;

  // ── 1. Fetch product to get eBay item ID ───────────────────────────────────
  let ebayItemId: string | null = null;
  try {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (res.status === 401) return NextResponse.json({ error: "Session expired." }, { status: 401 });

    if (res.ok) {
      const json = await res.json().catch(() => ({})) as { data?: { ebay_item_id?: string }; ebay_item_id?: string };
      const p = json.data ?? json;
      ebayItemId = (p as { ebay_item_id?: string }).ebay_item_id ?? null;
    }
  } catch (err) {
    console.error(`[ebay/remove] fetch product ${id}:`, err instanceof Error ? err.message : String(err));
  }

  // ── 2. End eBay listing (if we have the item ID) ───────────────────────────
  if (ebayItemId) {
    const { error } = await removeProductFromEbay(ebayItemId);
    if (error) {
      return NextResponse.json({ error }, { status: 422 });
    }
  } else {
    // No item ID stored — listing might already be ended or was never tracked
    console.warn(`[ebay/remove] product ${id} has no ebay_item_id — skipping eBay EndItem call`);
  }

  // ── 3. Update backend: mark product as unlisted ────────────────────────────
  try {
    await fetch(`${API_URL}/admin/products/${id}`, {
      method: "PATCH",
      headers: {
        Authorization:  `Bearer ${token}`,
        Accept:         "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ebay_listed: false, ebay_item_id: null }),
      cache: "no-store",
    });
  } catch (err) {
    console.error(`[ebay/remove] backend PATCH failed for product ${id}:`, err instanceof Error ? err.message : String(err));
  }

  return NextResponse.json({ ok: true, message: "Removed from eBay." });
}
