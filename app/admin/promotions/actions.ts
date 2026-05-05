"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  return token;
}

function revalidatePromotions() {
  revalidatePath("/admin/promotions");
  revalidatePath("/shop");
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createPromotion(data: {
  title: string;
  subheadline?: string;
  short_text?: string;
  emoji?: string;
  button_text?: string;
  button_link?: string;
  placement?: "announcement_bar" | "shop_inline" | "shop_hero" | "both";
  brand_name?: string;
  customer_type_target?: "all" | "b2c" | "b2b";
  discount_pct?: number;
  promo_code?: string;
  code?: string;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
}): Promise<{ error?: string; id?: number }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/promotions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || `Failed to create promotion (HTTP ${res.status}).` };
  }

  revalidatePromotions();
  return { id: json.data?.id };
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updatePromotion(
  id: number,
  data: {
    title?: string;
    subheadline?: string;
    short_text?: string;
    emoji?: string;
    button_text?: string;
    button_link?: string;
    placement?: "announcement_bar" | "shop_inline" | "shop_hero" | "both";
    brand_name?: string;
    customer_type_target?: "all" | "b2c" | "b2b";
    discount_pct?: number;
    promo_code?: string;
    code?: string;
    is_active?: boolean;
    start_date?: string;
    end_date?: string;
  }
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/promotions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || `Failed to update promotion (HTTP ${res.status}).` };
  }

  revalidatePromotions();
  return {};
}

// ── Toggle active ─────────────────────────────────────────────────────────────

export async function togglePromotion(
  id: number,
  isActive: boolean
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/promotions/${id}/toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active: isActive }),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || `Failed to toggle promotion (HTTP ${res.status}).` };
  }

  revalidatePromotions();
  return {};
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deletePromotion(id: number): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/promotions/${id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  if (!res.ok && res.status !== 204) {
    const json = await res.json().catch(() => ({}));
    return { error: json.message || `Failed to delete promotion (HTTP ${res.status}).` };
  }

  revalidatePromotions();
  return {};
}
