"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  listProductOnEbay,
  removeProductFromEbay,
  type EbayProduct,
} from "@/lib/ebay";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) redirect("/admin/login");
  return token;
}

// ── Cache revalidation ────────────────────────────────────────────────────────

/**
 * Bust the ISR page cache for all public shop pages after any product mutation.
 */
function revalidateProducts(id?: number) {
  revalidatePath("/shop", "page");
  revalidatePath("/shop/[id]", "page");
  if (id) revalidatePath(`/shop/${id}`, "page");
  revalidatePath("/admin/products");
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProductInput = {
  sku: string;
  brand: string;
  name: string;
  size: string;
  spec: string;
  season: string;
  type: string;
  price: number;
  description: string;
  is_active: boolean;
  // Optional pricing tiers
  price_b2b?: number | null;
  price_b2c?: number | null;
  // Extended tyre specification fields (from CSV)
  width?: number | null;
  height?: number | null;
  rim?: number | null;
  load_index?: number | null;
  speed_rating?: string | null;
  inventory?: number | null;
  cost?: number | null;
};

// ── CRUD actions ──────────────────────────────────────────────────────────────

export async function createProduct(
  data: ProductInput
): Promise<{ error?: string; id?: number }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products`, {
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
    return { error: json.message || `Failed to create product (HTTP ${res.status}).` };
  }

  revalidateProducts();
  return { id: json.data?.id };
}

export async function updateProduct(
  id: number,
  data: ProductInput
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${id}`, {
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
    return { error: json.message || `Failed to update product (HTTP ${res.status}).` };
  }

  revalidateProducts(id);
  revalidatePath(`/admin/products/${id}`);
  return {};
}

export async function deleteProduct(
  id: number
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  if (!res.ok && res.status !== 204) {
    const json = await res.json().catch(() => ({}));
    return { error: json.message || `Failed to delete product (HTTP ${res.status}).` };
  }

  revalidateProducts(id);
  return {};
}

export async function toggleProductActive(
  id: number,
  active: boolean
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active: active }),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || "Failed to toggle product status." };
  }

  revalidateProducts(id);
  return {};
}

export async function toggleProductStock(
  id: number,
  inStock: boolean
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ in_stock: inStock }),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || "Failed to update stock status." };
  }

  revalidateProducts(id);
  return {};
}

async function bulkStockUpdate(inStock: boolean): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/bulk-stock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ in_stock: inStock, all: true }),
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || "Failed to update stock status." };
  }

  revalidateProducts();
  return {};
}

export async function markAllOutOfStock(): Promise<{ error?: string }> {
  return bulkStockUpdate(false);
}

export async function markAllInStock(): Promise<{ error?: string }> {
  return bulkStockUpdate(true);
}

// ── Image actions ─────────────────────────────────────────────────────────────

/**
 * Upload or replace the product's primary/cover image.
 *
 * Uses POST /admin/products/{id}/primary-image (dedicated endpoint, same
 * pattern as the gallery upload at /admin/products/{id}/images).
 * Do NOT set Content-Type — the runtime sets the multipart boundary automatically.
 */
export async function uploadProductPrimaryImage(
  productId: number,
  formData: FormData
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${productId}/primary-image`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not upload image." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || "Failed to upload primary image." };
  }

  revalidateProducts(productId);
  revalidatePath(`/admin/products/${productId}`);
  return {};
}

/**
 * Upload one or more gallery images.
 * The FormData must contain one or more "images[]" file entries.
 * Do NOT set Content-Type — the runtime sets the multipart boundary automatically.
 */
export async function uploadProductImages(
  productId: number,
  formData: FormData
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${productId}/images`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not upload images." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || "Failed to upload images." };
  }

  revalidateProducts(productId);
  revalidatePath(`/admin/products/${productId}`);
  return {};
}

export async function deleteProductImage(
  productId: number,
  imageId: number
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${productId}/images/${imageId}`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not delete image." };
  }

  if (!res.ok && res.status !== 204) {
    const json = await res.json().catch(() => ({}));
    return { error: json.message || "Failed to delete image." };
  }

  revalidateProducts(productId);
  revalidatePath(`/admin/products/${productId}`);
  return {};
}

export async function listOnEbay(
  id: number
): Promise<{ error?: string }> {
  const token = await getToken();

  // 1. Fetch product from backend
  let product: EbayProduct;
  try {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return { error: "Product not found." };
    const json = await res.json().catch(() => ({})) as { data?: EbayProduct } & EbayProduct;
    product = json.data ?? json;
    if (!product?.id) return { error: "Could not load product data." };
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  // 2. List on eBay via Trading API
  const { itemId, error } = await listProductOnEbay(product);
  if (error) return { error };

  // 3. Persist ebay_listed + ebay_item_id on the backend
  try {
    await fetch(`${API_URL}/admin/products/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ebay_listed: true,
        ...(itemId ? { ebay_item_id: itemId } : {}),
      }),
      cache: "no-store",
    });
  } catch {
    // Listing is live — log but don't fail the action
    console.error(`[listOnEbay] backend PATCH failed for product ${id}`);
  }

  revalidateProducts(id);
  revalidatePath("/admin/ebay");
  return {};
}

export async function removeFromEbay(
  id: number
): Promise<{ error?: string }> {
  const token = await getToken();

  // 1. Get ebay_item_id from backend
  let ebayItemId: string | null = null;
  try {
    const res = await fetch(`${API_URL}/admin/products/${id}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({})) as { data?: { ebay_item_id?: string }; ebay_item_id?: string };
      const p = json.data ?? json;
      ebayItemId = (p as { ebay_item_id?: string }).ebay_item_id ?? null;
    }
  } catch {
    // Continue — will skip EndItem if no item ID
  }

  // 2. End eBay listing via Trading API
  if (ebayItemId) {
    const { error } = await removeProductFromEbay(ebayItemId);
    if (error) return { error };
  } else {
    console.warn(`[removeFromEbay] product ${id} has no ebay_item_id — skipping EndItem call`);
  }

  // 3. Clear ebay_listed + ebay_item_id on backend
  try {
    await fetch(`${API_URL}/admin/products/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ebay_listed: false, ebay_item_id: null }),
      cache: "no-store",
    });
  } catch {
    console.error(`[removeFromEbay] backend PATCH failed for product ${id}`);
  }

  revalidateProducts(id);
  revalidatePath("/admin/ebay");
  return {};
}

export async function restoreProduct(
  id: number
): Promise<{ error?: string }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/${id}/restore`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { error: json.message || `Failed to restore product (HTTP ${res.status}).` };
  }

  revalidateProducts(id);
  revalidatePath("/admin/products/trash");
  return {};
}

export async function deleteAllProducts(): Promise<{ error?: string; deleted?: number }> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/products/all`, {
      method: "DELETE",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return { error: "Network error. Could not reach the server." };
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 204) {
    return { error: json.message || `Failed to delete all products (HTTP ${res.status}).` };
  }

  revalidateProducts();
  revalidatePath("/shop", "page");
  return { deleted: json.data?.deleted ?? json.deleted };
}
