import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

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
    // Backend uses 'code' for the promo code field; frontend convention is 'promo_code'.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = rawArray.map((p: any) => ({
      ...p,
      promo_code: p.promo_code ?? p.code ?? null,
      brand_name: p.brand_name ?? p.brand   ?? null,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
