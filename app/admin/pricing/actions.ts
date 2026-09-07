"use server";

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Types (mirror GET /admin/pricing/preview) ─────────────────────────────────

export type PriceTier = "premium" | "midrange" | "budget";

export type PricingRow = {
  id: number;
  sku: string | null;
  brand: string | null;
  name: string;
  size: string | null;
  type: string | null;
  season: string | null;
  stock: number;
  is_active: boolean;
  ebay_listed: boolean;
  tier: PriceTier | null;
  /** The Tyre100 supplier price. */
  cost_price: number | null;
  current_price: number;
  /** cost × (1 + tier margin) × (1 + Stripe 3%) — what the site should charge. */
  website_price: number | null;
  /** cost × (1 + tier margin) × (1 + eBay 9.5%) — what the eBay offer is pushed at. */
  ebay_price: number | null;
  /** website_price − current_price when applying would change the site price. */
  price_change: number | null;
};

export type PricingMeta = {
  counts: {
    total: number;
    missing_tier: number;
    missing_cost: number;
    ready: number;
    would_change: number;
  };
  brands: string[];
  pricing_model: {
    margins: { premium: number; midrange: number; budget: number };
    stripe_fee_percent: number;
    ebay_uplift_percent: number;
  };
};

async function authedFetch(path: string, init?: RequestInit): Promise<{ json: Record<string, unknown> | null; error?: string }> {
  const store = await cookies();
  const token = store.get("admin_token")?.value;
  if (!token) return { json: null, error: "Not authenticated." };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch {
    return { json: null, error: "Could not reach the server." };
  }

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 403) return { json: null, error: "You do not have permission for tier pricing." };
  if (!res.ok) return { json: null, error: (typeof json.message === "string" && json.message) || "Request failed." };
  return { json };
}

export async function getPricingPreview(): Promise<{ rows?: PricingRow[]; meta?: PricingMeta; error?: string }> {
  const { json, error } = await authedFetch("/admin/pricing/preview");
  if (error || !json) return { error };
  return { rows: (json.data as PricingRow[]) ?? [], meta: json.meta as PricingMeta };
}

/** Assign a tier to a whole brand, or to ticked product ids. */
export async function setTier(
  tier: PriceTier,
  target: { brand: string } | { ids: number[] }
): Promise<{ error?: string; message?: string }> {
  const { json, error } = await authedFetch("/admin/pricing/set-tier", {
    method: "POST",
    body: JSON.stringify({ tier, ...target }),
  });
  if (error || !json) return { error };
  return { message: typeof json.message === "string" ? json.message : undefined };
}

/** Write the formula's website price into products.price — ids, or everything priceable. */
export async function applyPricing(
  target: { ids: number[] } | { all: true }
): Promise<{ error?: string; message?: string; updated?: number; skipped?: { id: number; sku: string | null; reason: string }[] }> {
  const { json, error } = await authedFetch("/admin/pricing/apply", {
    method: "POST",
    body: JSON.stringify(target),
  });
  if (error || !json) return { error };
  const data = json.data as { skipped?: { id: number; sku: string | null; reason: string }[] } | undefined;
  const meta = json.meta as { updated_count?: number } | undefined;
  return {
    message: typeof json.message === "string" ? json.message : undefined,
    updated: meta?.updated_count,
    skipped: data?.skipped ?? [],
  };
}
