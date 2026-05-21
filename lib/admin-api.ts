/**
 * lib/admin-api.ts
 *
 * Authenticated API helper for the Okelcor admin panel.
 *
 * - Reads the Sanctum token from the admin_token cookie (server-side only)
 * - Sends Authorization: Bearer {token} on every request
 * - Throws AdminUnauthorizedError on missing token or 401 response
 *   (callers should catch this and redirect to /admin/login)
 * - Throws AdminApiError on any other non-ok response
 */

import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Typed errors ──────────────────────────────────────────────────────────────

export class AdminUnauthorizedError extends Error {
  constructor() {
    super("Admin authentication required");
    this.name = "AdminUnauthorizedError";
  }
}

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export class AdminForbiddenError extends Error {
  constructor() {
    super("Access forbidden — your role does not have permission for this resource");
    this.name = "AdminForbiddenError";
  }
}

// ── Response envelope ─────────────────────────────────────────────────────────

export type AdminApiResponse<T> = {
  data: T;
  meta: {
    total?: number;
    current_page?: number;
    last_page?: number;
    per_page?: number;
    [key: string]: unknown;
  };
  message: string;
};

// ── Domain types ──────────────────────────────────────────────────────────────

export type AdminProductImage = {
  id: number;
  url: string;
};

export type AdminProduct = {
  id: number;
  brand: string;
  name: string;
  size: string;
  spec?: string;
  season?: string;
  type: string;
  price: number;
  price_b2b?: number | null;
  price_b2c?: number | null;
  /** List endpoint returns image_url; detail endpoint may return primary_image */
  image_url?: string | null;
  primary_image?: string | null;
  /** Gallery images — admin API returns objects with id + url for deletion support */
  images?: AdminProductImage[];
  sku: string;
  description?: string;
  is_active?: boolean;
  in_stock?: boolean;
  ebay_listed?: boolean;
  ebay_item_id?: string | null;
  ebay_status?: string | null;
  ebay_offer_id?: string | null;
  ebay_last_synced_at?: string | null;
  ebay_sync_error?: string | null;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  // Extended tyre specification fields (populated via CSV import)
  width?: number | null;
  height?: number | null;
  rim?: number | null;
  load_index?: number | null;
  speed_rating?: string | null;
  inventory?: number | null;
  cost?: number | null;
};

/** Per-locale content block used in both list and detail article responses. */
export type ArticleTranslation = {
  category: string;
  title: string;
  read_time: string;
  summary: string;
  /** HTML string (new articles) or legacy plain-text paragraph array */
  body: string | string[];
  cover_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

/** Shape returned by GET /admin/articles (list). Text fields are flat top-level strings. */
export type AdminArticle = {
  id: number;
  slug: string;
  title: string;
  category: string;
  /** ISO date string — field name is published_at on the API */
  published_at: string;
  read_time?: string;
  image: string;
  summary?: string;
  is_published?: boolean;
  sort_order?: number;
  created_at?: string;
  deleted_at?: string | null;
};

/** Full article shape returned by GET /admin/articles/{id}. */
export type AdminArticleFull = {
  id: number;
  slug: string;
  image: string;
  og_image?: string | null;
  /** ISO date string — field name is published_at on the API */
  published_at: string;
  is_published: boolean;
  sort_order?: number;
  translations: {
    en?: ArticleTranslation;
    de?: ArticleTranslation;
    fr?: ArticleTranslation;
    es?: ArticleTranslation;
  };
  created_at?: string;
};

export type AdminOrder = {
  id: number;
  order_ref: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: "pending" | "confirmed" | "awaiting_proforma" | "shipped" | "delivered" | "cancelled" | string;
  payment_method?: string;
  payment_status?: "paid" | "unpaid" | "refunded" | string;
  created_at: string;
  /** "website" (default) or "ebay" */
  source?: string | null;
};

export type AdminOrderItem = {
  id: number;
  product_id?: number;
  product_name: string;
  brand?: string;
  size?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type AdminOrderLog = {
  id: number;
  action: string;
  old_value?: string | null;
  new_value?: string | null;
  notes?: string | null;
  admin_user_email?: string | null;
  ip_address?: string | null;
  created_at: string;
};

export type ShipmentEvent = {
  id: number;
  event_date?: string | null;
  status_label: string;
  location?: string | null;
  description?: string | null;
  created_at?: string;
};

export type TradeDocument = {
  id: number;
  type: "order_confirmation" | "proforma_invoice" | "commercial_invoice" | "packing_list" | "delivery_note" | "shipment_document" | "other" | string;
  number?: string | null;
  status: "draft" | "issued" | "sent" | "superseded" | "void" | string;
  supersede_reason?: string | null;
  issued_at?: string | null;
  sent_at?: string | null;
  original_filename?: string | null;
  document_label?: string | null;
  notes?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
};

export type EbayOrder = {
  /** eBay's native order ID, e.g. "12-34567-89012" */
  ebay_order_id: string;
  /** Okelcor order ref if already imported, e.g. "OKL-00042" */
  order_ref?: string | null;
  /** Internal Okelcor order id if imported */
  order_id?: number | null;
  buyer_username?: string | null;
  buyer_email?: string | null;
  /** eBay orderPaymentStatus: PAID | PENDING | FAILED | … */
  ebay_payment_status?: string | null;
  /** eBay orderFulfillmentStatus: NOT_STARTED | IN_PROGRESS | FULFILLED | CANCELLED */
  ebay_fulfillment_status?: string | null;
  /** Mapped Okelcor order status */
  status?: string | null;
  total?: number | null;
  currency?: string | null;
  ebay_last_synced_at?: string | null;
  created_at?: string | null;
};

export type EbaySyncResult = {
  imported_count: number;
  updated_count: number;
  failed_count: number;
  errors?: string[];
};

export type AdminOrderFull = AdminOrder & {
  phone?: string;
  company_name?: string;
  country?: string;
  address?: string;
  notes?: string;
  container_number?: string;    // legacy — kept for backward compat
  tracking_status?: string;
  carrier?: string | null;
  carrier_type?: string | null;
  tracking_number?: string | null;
  estimated_delivery?: string | null;
  eta?: string;
  items: AdminOrderItem[];
  logs?: AdminOrderLog[];
  shipment_events?: ShipmentEvent[];
  updated_at?: string;
  // EU Entry Certificate (Gelangensbestätigung)
  declaration_required?: boolean | null;
  declaration_status?: "pending" | "signed" | "acknowledged" | null;
  declaration_id?: number | null;
  declaration_signed_at?: string | null;
  // Trade documents (proforma, commercial invoice, packing list, etc.)
  trade_documents?: TradeDocument[];
  // DOC-7 payment milestones
  payment_stage?: "pending_proforma" | "deposit_requested" | "deposit_paid" | "balance_due" | "balance_paid" | "shipment_released" | null;
  deposit_percent?: number | null;
  deposit_amount?: number | null;
  deposit_paid_at?: string | null;
  balance_amount?: number | null;
  balance_paid_at?: string | null;
  shipment_released_at?: string | null;
  shipment_release_note?: string | null;
  // DOC-8 milestone email tracking (null = not sent, string = ISO sent-at)
  deposit_requested_email_sent_at?: string | null;
  deposit_paid_email_sent_at?: string | null;
  balance_due_email_sent_at?: string | null;
  balance_paid_email_sent_at?: string | null;
  shipment_released_email_sent_at?: string | null;
  // EB-5 eBay order fields (source = "ebay" orders only)
  ebay_order_id?: string | null;
  ebay_order_status?: string | null;
  ebay_payment_status?: string | null;
  ebay_fulfillment_status?: string | null;
  ebay_buyer_username?: string | null;
  ebay_last_synced_at?: string | null;
  // DOC-5 financial lock
  financials_locked?: boolean | null;
  financials_locked_at?: string | null;
  financials_lock_reason?: string | null;
  financials_revision_required?: boolean | null;
  financials_revision_reason?: string | null;
  // DOC-6 customer acceptance
  customer_acceptance_status?: "pending" | "accepted" | "rejected" | null;
  customer_accepted_at?: string | null;
  customer_rejection_reason?: string | null;
};

export type AdminQuote = {
  id: number;
  ref_number: string;
  full_name: string;
  company_name?: string;
  email: string;
  tyre_category: string;
  country: string;
  quantity?: string;
  status: "new" | "reviewed" | "quoted" | "closed" | string;
  created_at: string;
  order_id?: number | null;
  order_ref?: string | null;
};

export type AdminQuoteFull = AdminQuote & {
  phone?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_postal_code?: string;
  delivery_location?: string;
  notes?: string;
  admin_notes?: string;
  brand_preference?: string;
  tyre_size?: string;
  updated_at?: string;
  // Attachment — backend may use any of these field names
  attachment_url?: string;           // full URL if backend provides one
  attachment_path?: string;          // storage path or full URL from backend
  attachment_name?: string;          // generic name alias
  attachment_original_name?: string; // original filename from upload
  attachment_mime?: string;          // MIME type e.g. "application/pdf"
  attachment_size?: number;          // bytes
  // Phase 2A-2 extended fields
  vat_number?: string;
  vat_valid?: boolean | null;
  business_type?: string;
  contact_person?: string;
  company_address?: string;
  company_city?: string;
  company_postal_code?: string;
  tyre_condition?: string;
  used_tyre_grade?: string;
  used_tyre_notes?: string;
  tyre_items?: Array<{ size: string; quantity: string }> | null;
  delivery_timeline?: string;
  budget_range?: string;
  incoterm?: string;
  incoterm_type?: string;
};

export type AdminHeroSlideTranslation = {
  locale: "de" | "fr" | "es";
  title?: string;
  subtitle?: string;
  cta_primary?: string;
  cta_secondary?: string;
};

export type AdminHeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  video_url?: string | null;
  media_type?: "image" | "video";
  order: number;
  cta_primary_label?: string;
  cta_primary_href?: string;
  cta_secondary_label?: string;
  cta_secondary_href?: string;
  translations?: AdminHeroSlideTranslation[];
};

export type AdminBrand = {
  id: number;
  name: string;
  logo_url: string;
  order?: number;
};

export type AdminFetEngine = {
  id: number;
  category: "cars_suv" | "commercial";
  manufacturer: string;
  model_series: string;
  engine_code?: string | null;
  displacement?: string | null;
  fuel_type: "diesel" | "petrol" | "both";
  fet_model: string;
  notes?: string | null;
  created_at?: string;
};

export type AdminPromotion = {
  id: number;
  title: string;
  subheadline?: string | null;
  short_text?: string | null;
  emoji?: string | null;
  button_text?: string | null;
  button_link?: string | null;
  image_url?: string | null;
  placement?: "announcement_bar" | "shop_inline" | "shop_hero" | "both" | null;
  brand_name?: string | null;
  customer_type_target?: "b2c" | "b2b" | "all" | null;
  discount_pct?: number | null;
  promo_code?: string | null;
  /** Backend alias for promo_code — some responses use 'code' */
  code?: string | null;
  is_active: boolean;
  start_date?: string | null; // ISO date "YYYY-MM-DD"
  end_date?: string | null;   // ISO date "YYYY-MM-DD"
  created_at?: string;
};

export type AdminSetting = {
  key: string;
  value: string;
  label?: string;
  group?: string;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  role_label?: string;
  last_login_at: string | null;
  created_at?: string;
};

export type AdminProfile = {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email: string;
  role: string;
  role_label?: string;
  must_change_password?: boolean;
  last_login_at: string | null;
};

// ── Options ───────────────────────────────────────────────────────────────────

export type AdminFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Extra query params beyond locale */
  params?: Record<string, string | number>;
  /** Next.js ISR revalidation. Pass false for no-store (admin pages are always fresh). */
  revalidate?: number | false;
  tags?: string[];
};

// ── Core fetch ────────────────────────────────────────────────────────────────

export async function adminApiFetch<T>(
  path: string,
  options: AdminFetchOptions = {}
): Promise<AdminApiResponse<T>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    throw new AdminUnauthorizedError();
  }

  const { method = "GET", body, params, revalidate, tags } = options;

  const url = new URL(`${BASE_URL}/admin${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextCache: Record<string, any> = {};
  if (revalidate !== undefined) nextCache.revalidate = revalidate;
  if (tags?.length) nextCache.tags = tags;

  const res = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...(Object.keys(nextCache).length ? { next: nextCache } : {}),
  });

  if (res.status === 401) {
    throw new AdminUnauthorizedError();
  }

  if (res.status === 403) {
    throw new AdminForbiddenError();
  }

  if (!res.ok) {
    throw new AdminApiError(
      res.status,
      `[adminApiFetch] ${method} /admin${path} → HTTP ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<AdminApiResponse<T>>;
}

// ── Convenience: safe fetch (returns null on any error) ───────────────────────

export async function adminSafeFetch<T>(
  path: string,
  options?: AdminFetchOptions
): Promise<AdminApiResponse<T> | null> {
  try {
    return await adminApiFetch<T>(path, options);
  } catch {
    return null;
  }
}
