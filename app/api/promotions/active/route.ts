import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

// Extract ?brand= from a relative or absolute URL string.
// Used as a fallback when brand_name is not set on the promotion record
// but the admin configured a button_link like /shop?brand=Rapid.
function brandFromLink(link: string | null | undefined): string | null {
  if (!link) return null;
  try {
    return new URL(link, "https://placeholder.invalid").searchParams.get("brand") ?? null;
  } catch { return null; }
}

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/promotions/active`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return NextResponse.json({ data: [] });
    const json = await res.json();

    // Backend may return a single object or an array — normalise to array
    const raw = json.data ?? json;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawArray: any[] = Array.isArray(raw) ? raw : raw?.id ? [raw] : [];

    // Normalise field-name variants from the backend before sending to the client.
    // brand_name falls back to: backend 'brand' field → brand extracted from button_link
    // (covers the common case where admin fills button_link=/shop?brand=Rapid but
    //  leaves brand_name blank — the specials section needs brand_name to fetch products).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = rawArray.map((p: any) => ({
      ...p,
      promo_code: p.promo_code ?? p.code                                ?? null,
      brand_name: p.brand_name ?? p.brand ?? brandFromLink(p.button_link) ?? null,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
