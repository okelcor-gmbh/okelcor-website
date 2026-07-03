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
  type: "order_confirmation" | "proforma_invoice" | "proforma_signed" | "commercial_invoice" | "packing_list" | "delivery_note" | "shipment_document" | "other" | string;
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
  acceptance_token?: string | null;
};

// CRM-6 communications
export type CommunicationType = "email" | "call" | "whatsapp" | "note" | "system";
export type CommunicationDirection = "inbound" | "outbound" | "internal";
export type CommunicationStatus = "planned" | "sent" | "failed" | "completed" | "skipped";

export type Communication = {
  id: number;
  customer_id?: number | null;
  quote_request_id?: number | null;
  order_id?: number | null;
  admin_user_id?: number | null;
  admin_user_name?: string | null;
  type: CommunicationType | string;
  direction: CommunicationDirection | string;
  subject?: string | null;
  body?: string | null;
  status: CommunicationStatus | string;
  scheduled_at?: string | null;
  completed_at?: string | null;
  created_at: string;
};

export type EmailTemplate = {
  key: string;
  label: string;
  subject: string;
  body?: string | null;
};

export type FollowUpItem = {
  id: number;               // quote_request.id
  ref_number: string;
  full_name: string;
  company_name?: string | null;
  email: string;
  country?: string | null;
  follow_up_at?: string | null;
  lead_priority?: string | null;
  qualification_status?: string | null;
  assigned_to_name?: string | null;
  last_communication_at?: string | null;
  last_communication_type?: string | null;
};

// CRM-5 data quality
export type DataQualityReviewStatus =
  | "clean" | "needs_review" | "duplicate_suspected" | "merged" | "ignored";

export type DataQualityFlag =
  | "duplicate_email" | "duplicate_phone" | "duplicate_company_country"
  | "missing_phone" | "missing_country" | "missing_company" | "missing_address"
  | "weak_company_name" | "personal_email_for_b2b" | "incomplete_profile";

export type QuoteReviewStatus =
  | "new"
  | "needs_review"
  | "qualified"
  | "rejected"
  | "spam";

// CRM-3 pipeline types
export type LeadPriority = "low" | "normal" | "high" | "urgent";
export type LeadCustomerType =
  | "private_buyer" | "dealer" | "workshop" | "fleet" | "exporter" | "unknown";
export type QualificationStatus =
  | "new" | "needs_review" | "qualified" | "proposal_sent"
  | "customer_invited" | "converted" | "rejected" | "spam" | "closed";
export type LeadSource =
  | "website_quote" | "contact_form" | "ebay" | "phone" | "email" | "referral";

// CRM-3 / CRM-3B: admin notifications (e.g. "lead assigned to you")
export type AdminNotificationType =
  | "lead_assigned"
  | "follow_up_due"
  | "proposal_accepted"
  | "proposal_rejected"
  | "customer_access_requested"
  | "customer_approval_needed"
  | "quote_needs_review"
  | "order_payment_milestone"
  | "document_action_needed"
  | string;

export type AdminNotificationSeverity = "info" | "success" | "warning" | "urgent";

export type AdminNotificationRelatedType =
  | "quote_request" | "customer" | "order" | "trade_document" | "follow_up" | string;

export type AdminNotification = {
  id: number;
  type: AdminNotificationType;
  title: string;
  /** CRM-3B body text. Legacy backend used `message` — read with `body ?? message`. */
  body?: string | null;
  message?: string | null;
  severity?: AdminNotificationSeverity | null;
  /** CRM-3B link. Legacy backend used `link` — read with `action_url ?? link`. */
  action_url?: string | null;
  link?: string | null;
  related_type?: AdminNotificationRelatedType | null;
  related_id?: number | null;
  read_at?: string | null;
  dismissed_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

// CRM-3B: actionable work queue item (GET /admin/my-work)
export type MyWorkType =
  | "assigned_lead"
  | "follow_up"
  | "proposal_accepted"
  | "customer_approval"
  | "access_request"
  | string;

export type MyWorkItem = {
  type: MyWorkType;
  title: string;
  subtitle?: string | null;
  priority?: "low" | "normal" | "high" | "urgent" | string | null;
  due_at?: string | null;
  action_url?: string | null;
  status?: string | null;
};

// CRM-7 quote request items (admin-structured line items for proposal)
export type QuoteItem = {
  id: number;
  quote_request_id: number;
  product_id?: number | null;
  brand?: string | null;
  model?: string | null;
  size?: string | null;
  season?: string | null;
  load_index?: string | null;
  speed_index?: string | null;
  quantity: number;
  unit_price?: number | null;
  currency?: string | null;
  notes?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
};

// CRM-7 proposal lifecycle
export type ProposalStatus =
  | "none" | "draft" | "ready" | "sent" | "accepted"
  | "rejected" | "expired" | "converted";

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
  // CRM-2 quality fields
  quality_score?: number | null;
  quality_flags?: string[] | null;
  review_status?: QuoteReviewStatus | string;
  // CRM-3 pipeline fields (all optional — backend may not return yet)
  assigned_to?: number | null;
  assigned_to_name?: string | null;
  follow_up_at?: string | null;
  lead_priority?: LeadPriority | string;
  lead_source?: LeadSource | string | null;
  lead_customer_type?: LeadCustomerType | string;
  qualification_status?: QualificationStatus | string;
  // CRM-7 proposal fields (list-level — for table badge)
  proposal_status?: ProposalStatus | string | null;
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
  // CRM-2 review audit fields
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  // CRM-3 lead qualification fields
  qualification_reason?: string | null;
  internal_notes?: string | null;
  assigned_at?: string | null;
  // CRM-5 existing-customer link
  possible_customer_id?: number | null;
  possible_customer_name?: string | null;
  lead_existing_customer?: boolean | null;
  // CRM-7 proposal management
  proposal_status?: ProposalStatus | string | null;
  proposal_number?: string | null;
  proposal_sent_at?: string | null;
  proposal_accepted_at?: string | null;
  proposal_rejected_at?: string | null;
  proposal_expires_at?: string | null;
  proposal_acceptance_token?: string | null;
  proposal_rejection_reason?: string | null;
  proposal_total?: number | null;
  proposal_currency?: string | null;
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
  // CRM-5 data quality fields (returned by customer detail/list endpoints)
  data_quality_score?: number | null;
  data_quality_flags?: DataQualityFlag[] | string[] | null;
  data_review_status?: DataQualityReviewStatus | string;
  normalized_email?: string | null;
  normalized_company_name?: string | null;
  possible_duplicate_of?: number | null;
  possible_duplicate_name?: string | null;
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

// ── Media Library ─────────────────────────────────────────────────────────────

export type MediaItem = {
  id: number;
  filename: string;
  original_name: string;
  path: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  collection: string;
  created_at: string;
};

export const MEDIA_COLLECTIONS = [
  "articles", "products", "hero", "brands", "categories", "general",
] as const;

export type MediaCollection = typeof MEDIA_COLLECTIONS[number];

// ── Marketing Contacts ────────────────────────────────────────────────────────

export type MarketingContactStatus = "subscribed" | "unsubscribed" | "unknown";

export type MarketingContact = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company?: string | null;
  country?: string | null;
  vat_id?: string | null;
  labels?: string | null;
  source?: string | null;
  status: MarketingContactStatus;
  created_at: string;
  updated_at: string;
};

export type MarketingContactStats = {
  total: number;
  subscribed: number;
  unsubscribed: number;
  unknown: number;
};

export type MarketingContactImportResult = {
  imported: number;
  updated: number;
  skipped_no_email: number;
  unsubscribed: number;
  subscribed: number;
  errors: string[];
};

// ── Bulk Email Campaigns ──────────────────────────────────────────────────────

export type BulkEmailStatus = "queued" | "sending" | "completed" | "failed";

export type BulkEmailFilters = {
  company?: string;
  country?: string;
  status?: "subscribed" | "unknown";
  search?: string;
};

export type BulkEmail = {
  id: number;
  subject: string;
  body_html?: string | null;
  filters?: BulkEmailFilters | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: BulkEmailStatus;
  created_by: string;
  created_at: string;
  completed_at?: string | null;
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
