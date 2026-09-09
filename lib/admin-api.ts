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
  /** Listing audience: both | b2b | b2c (Session 116). */
  audience?: string;
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
  // Extended tyre specification fields (CSV import, or the admin spec sheet
  // since Session 92). Stored as strings backend-side — "10.5" rims and
  // "91/89" load indexes are real values.
  width?: string | number | null;
  height?: string | number | null;
  rim?: string | number | null;
  load_index?: string | number | null;
  speed_rating?: string | null;
  ean?: string | null;
  tread_depth_mm?: number | null;
  inventory?: number | null;
  cost?: number | null;
  // Product optimization (Session 92)
  slug?: string | null;
  description_html?: string | null;
  specs?: Record<string, string | boolean> | null;
  shipping_info?: string | null;
  returns_info?: string | null;
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
  /** ISO 4217 code — "EUR" (default) or "USD". Order-level; all item/milestone amounts share it. */
  currency?: string | null;
  status: "pending" | "confirmed" | "awaiting_proforma" | "shipped" | "delivered" | "cancelled" | string;
  payment_method?: string;
  payment_status?: "paid" | "unpaid" | "refunded" | string;
  created_at: string;
  /** "website" (default) or "ebay" */
  source?: string | null;
  /**
   * Sales channel, derived server-side from `source` and never stored — "a
   * second column saying the same thing is a column that can disagree with it".
   * Present on both the list row and the detail payload.
   */
  channel?: "normal" | "ebay" | string | null;
  /**
   * **Meaning changed in session 87.** This was `shipped` only; it now covers
   * the whole fulfilment window — `confirmed`, `processing` or `shipped`, still
   * requiring payment far enough along and still stopping at `delivered`. The
   * count jumped on deploy by design: trade documents get issued *before* a
   * container leaves as often as after, so a queue that only appeared once an
   * order was dispatched showed the work after the moment to do it had passed.
   */
  in_transit?: boolean | null;
  /**
   * Which half of that window. `ready_to_ship` is paperwork-and-status work;
   * `in_transit` is chase-the-carrier work. Null when the order is in neither.
   */
  fulfilment_stage?: "ready_to_ship" | "in_transit" | null;
};

/** One half of an order confirmation's dual sign-off. */
export type OrderSignoffSlot = {
  slot: "ops" | "finance" | string;
  label: string;
  signed: boolean;
  signed_by?: string | null;
  signed_role?: string | null;
  signed_at?: string | null;
  note?: string | null;
  permission?: string | null;
  roles?: string[] | null;
};

export type OrderSignoffHistoryEntry = {
  slot: string;
  label?: string | null;
  signed_by?: string | null;
  signed_at?: string | null;
  note?: string | null;
  revoked?: boolean | null;
  revoked_by?: string | null;
  revoked_at?: string | null;
  revoke_reason?: string | null;
};

/**
 * Sign-off state for an order confirmation.
 *
 * Served two ways with **one difference that matters**: `GET /admin/orders/{id}`
 * embeds this block (so the panel renders with no second request), but
 * `you_may_sign` is added only by `GET /admin/orders/{id}/signoffs`
 * (`AdminOrderSignoffController:39` — the shared `state()` does not include it).
 * It cannot be derived on the client either: the entitlement check compares
 * `admin_user_id` for the two-different-people rule, and the slots carry a
 * display name, not an id. So the panel paints from the embedded block and
 * fetches the dedicated endpoint only to decide which button to offer.
 */
export type OrderSignoffState = {
  required: boolean;
  complete: boolean;
  /** `not_required` means the order predates the rule — not the same as `awaiting`. */
  status: "not_required" | "awaiting" | "partial" | "complete" | string;
  signed_count?: number;
  slots: OrderSignoffSlot[];
  history?: OrderSignoffHistoryEntry[];
  /** Only on GET /orders/{id}/signoffs. Slots *this* admin may sign right now. */
  you_may_sign?: string[];
  available?: boolean;
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
  /** Dual sign-off state, embedded so the order page needs no second request. */
  signoff?: OrderSignoffState | null;
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
  /**
   * Backend's authoritative flag (`Order::paymentMilestonesActive`): the ladder
   * has genuinely been started. False on `pending_proforma`, which is the
   * resting state of every order — a proforma no longer starts it. Prefer this
   * over recomputing from `payment_stage`.
   */
  payment_milestones_active?: boolean | null;
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
  /**
   * Session 99 profitability summary, embedded so order tracking knows the
   * finalized revenue invoice exists without a second request. `null` until
   * the backend migration has run — hide the panel, don't error.
   */
  finance?: OrderFinanceSummary | null;
};

// CRM-6 communications
export type CommunicationType = "email" | "call" | "whatsapp" | "note" | "system";
export type CommunicationDirection = "inbound" | "outbound" | "internal";
export type CommunicationStatus = "planned" | "sent" | "failed" | "completed" | "skipped";

export type CommunicationAttachment = {
  name: string;
  mime?: string | null;
  size?: number | null;
  download_url?: string | null;
};

export type Communication = {
  id: number;
  customer_id?: number | null;
  quote_request_id?: number | null;
  order_id?: number | null;
  admin_user_id?: number | null;
  admin_user_name?: string | null;
  type: CommunicationType | string;
  direction: CommunicationDirection | string;
  channel?: string | null;
  subject?: string | null;
  body?: string | null;
  cc?: string[] | null;
  attachments?: CommunicationAttachment[] | null;
  message_id?: string | null;
  in_reply_to?: number | null;
  staff_read_at?: string | null;
  customer_read_at?: string | null;
  // WhatsApp channel fields
  phone_number?: string | null;
  whatsapp_message_id?: string | null;
  whatsapp_status?: "sent" | "delivered" | "read" | "failed" | "received" | string | null;
  whatsapp_template_name?: string | null;
  status: CommunicationStatus | string;
  scheduled_at?: string | null;
  completed_at?: string | null;
  created_at: string;
};

// Unified communications inbox (GET /admin/communications/inbox)
export type AdminCommunicationsInboxItem = {
  id: number;
  customer_id?: number | null;
  quote_request_id?: number | null;
  customer_name?: string | null;
  channel: string;
  subject?: string | null;
  preview?: string | null;
  unread: boolean;
  action_url: string;
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
  | "website_quote" | "contact_form" | "ebay" | "phone" | "email" | "referral" | "whatsapp";

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
  | "email_reply_received"
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

// AI-generated admin insights: periodic AI summary of dashboard activity
// (GET /admin/insights) — see docs/BACKEND_NOTE_ai_insights.md for the full
// proposal. Not live yet; frontend degrades to an empty list until it is.
export type AdminInsightCategory =
  | "revenue" | "orders" | "inventory" | "security" | "quotes" | string;

export type AdminInsightSeverity = "positive" | "info" | "warning" | "critical";

export type AdminInsight = {
  id: string;
  category: AdminInsightCategory;
  severity: AdminInsightSeverity;
  headline: string;
  /** May contain **bold** markdown-lite spans — render via renderInsightDetail(). */
  detail: string;
  action_url?: string | null;
};

export type AdminInsightsResponse = {
  data: AdminInsight[];
  generated_at?: string | null;
  next_refresh_at?: string | null;
};

// CRM-3B: actionable work queue item (GET /admin/my-work).
// Type names match the API's own exactly — the earlier list here did not
// ("follow_up" vs the server's "follow_up_due" etc.), which combined with
// the grouped-vs-flat payload mismatch to render My Work permanently empty.
export type MyWorkType =
  | "assigned_lead"
  | "follow_up_due"
  | "proposal_accepted"
  | "finance_task"
  | "customer_approval_needed"
  | "customer_access_requested"
  | string;

export type MyWorkItem = {
  type: MyWorkType;
  /** Present on editable rows (finance_task) — the record id to PATCH. */
  id?: number;
  title: string;
  subtitle?: string | null;
  priority?: "low" | "normal" | "medium" | "high" | "urgent" | string | null;
  due_at?: string | null;
  action_url?: string | null;
  status?: string | null;
  /** finance_task / ec_invoice_task: the assignee may update status in place. */
  editable?: boolean;
  /**
   * The select's options travel with the item — the EC statuses are not the
   * finance-task statuses, and neither is the to-do set. Now served for every
   * editable row including finance tasks; the local list is a fallback only.
   */
  status_options?: { value: string; label: string }[];
  /**
   * finance_task: a link to the record on the snapshot board, present ONLY
   * for someone who may open that board (super_admin / finance). Null or
   * absent for every other assignee — render no board link rather than one
   * that 403s. `action_url` is where the task is actually worked.
   */
  board_url?: string | null;
  /**
   * finance_task: the task's raw fields (Session 107). The assignee cannot
   * open the board, so My Work is their whole view of it — and the note
   * (`comment`) is editable in place, which needs the raw value rather
   * than the copy baked into the subtitle.
   */
  category?: string | null;
  client?: string | null;
  amount?: number | null;
  comment?: string | null;
  /**
   * todo_task: the shared list, kept as a SECOND way out (Session 108).
   * `action_url` opens the task here in My Work; this opens it on the team
   * board. Unlike `board_url` it is never a 403 — every role holds
   * `staff.self` — so it is always populated for a to-do.
   */
  list_url?: string | null;
  /**
   * todo_task: the task's raw fields. Same reasoning as the finance block
   * above — these were baked into `subtitle`, so the row could show them but
   * never edit them, and the assignee had to leave My Work to read the brief.
   * `details` is whoever asked; `assignee_note` is this person's reply, and
   * they are two fields because they are two people talking.
   */
  details?: string | null;
  assignee_note?: string | null;
  creator?: string | null;
  /** todo_task: the department that raised it, e.g. "Finance". */
  department?: string | null;
  due_on?: string | null;
  /**
   * claim_task (Session 119): the claim's raw fields. `description` is the
   * customer's complaint and is read-only here; `outcome_note` is the
   * assignee's half and PATCHes via /api/admin/my-work/claims/{id}.
   * `queue_url` is served only when the viewer may open the claims queue
   * page — null means render no link rather than one that 403s.
   */
  description?: string | null;
  outcome_note?: string | null;
  customer?: string | null;
  claim_type?: string | null;
  queue_url?: string | null;
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
  /** Present once the customer has printed/signed/uploaded the proposal back (alternative to digital Accept). */
  proposal_signed_copy_download_url?: string | null;
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
  // Session 93 — brand-level content defaults, inherited by every product of
  // this brand that has no value of its own (product → brand → site setting).
  description_html?: string | null;
  specs?: Record<string, string | boolean> | null;
  shipping_info?: string | null;
  returns_info?: string | null;
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
  // Per-user permission overrides (admin users list/detail only)
  permissions?: string[];
  permission_grants?: string[];
  permission_revokes?: string[];
  has_permission_overrides?: boolean;
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
  email_signature?: string | null;
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
  /**
   * Primary market — a single string, the original contract. Still the one to
   * show where there's only room for one. It does NOT shift just because
   * another market was added alongside it.
   */
  market?: string | null;
  /**
   * Every market the contact belongs to, oldest first. Prefer this in new UI.
   * Falls back to a one-element array if migration #26 hasn't run yet, so
   * reading it is always safe.
   */
  markets?: string[] | null;
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
  /**
   * The file was recognised as an export from a known platform — `"wix"` today,
   * `null` for an ordinary CSV. Typed as a widened string so a second source
   * added server-side surfaces instead of being narrowed away.
   */
  source_detected?: "wix" | string | null;
  /**
   * Every market the contacts were put in, **chosen market first**.
   *
   * That order is load-bearing: the first entry stays each contact's primary
   * market, so nothing appears to have been relocated. Always present — an
   * ordinary import returns the one market that was picked.
   */
  markets_applied?: string[] | null;
};

/**
 * The three market operations share one selector shape, so a single UI
 * selection can drive any of them. Selectors are OR'd server-side; at least
 * one is required.
 */
export type MarketingContactMarketSelector = {
  contact_ids?: number[];
  emails?: string[];
  /** Whole-market operand. `from_market` + `to_market` alone = market rename. */
  from_market?: string;
};

export const MARKET_OPS = ["add-to-market", "move-market", "remove-from-market"] as const;
export type MarketingContactMarketOp = typeof MARKET_OPS[number];

/**
 * Shared result of add-to-market / move-market / remove-from-market. Which
 * counters are populated depends on the operation; all three return
 * `{ …counts, not_found[], contacts[] }`.
 *
 * Nothing is created or deleted by any of them: an address with no matching
 * contact comes back in `not_found` rather than being imported, and
 * unsubscribed contacts keep their status and token.
 */
export type MarketingContactMarketResult = {
  /** Destination, on add/move. */
  to_market?: string;
  /** The market departed, on remove. */
  market?: string;
  added?: number;
  moved?: number;
  removed?: number;
  already_in_place?: number;
  not_found?: string[];
  /**
   * Refused because it was the contact's last market — a contact always keeps
   * at least one. `removed: 0` plus a non-empty list here means "nothing
   * happened, here's why", NOT a failure. The fix is to move it elsewhere or
   * delete the contact outright.
   */
  skipped_last_market?: string[];
  contacts?: MarketingContact[];
};

/**
 * 422 body from POST /admin/marketing-contacts when the email already exists.
 * `errors.email` is still populated (unchanged), so any generic 422 handling
 * keeps working; these fields are additive and give the two real next steps.
 */
export type MarketingContactExistsError = {
  code: "contact_exists";
  message: string;
  errors?: { email?: string[] };
  data: {
    existing_contact: MarketingContact;
    existing_markets: string[];
    target_market: string;
    /** Add the target alongside what it already has. */
    can_add_market: boolean;
    /** Relocate it to the target instead. */
    can_move: boolean;
  };
};

// ── Bulk Email Campaigns ──────────────────────────────────────────────────────

export type BulkEmailStatus = "queued" | "sending" | "completed" | "failed";

export type BulkEmailFilters = {
  /** Single-market filter — original contract, still accepted. */
  market?: string;
  /**
   * Target several markets in one send. A contact in two of them is selected
   * exactly once, so nobody is emailed twice.
   */
  markets?: string[];
  company?: string;
  country?: string;
  status?: "subscribed" | "unknown";
  search?: string;
};

// ── Campaign designer (block-based authoring) ─────────────────────────────────

/** Input control to render for a block field. */
export type CampaignFieldType =
  | "text" | "textarea" | "select" | "number" | "url"
  | "image_url" | "text_list" | "link_list" | "group_list";

export type CampaignSelectOption = { value: string; label: string };

export type CampaignFieldSpec = {
  name: string;
  label: string;
  type: CampaignFieldType;
  required: boolean;
  options: CampaignSelectOption[];
  default?: unknown;
  min?: number;
  max?: number;
  placeholder?: string;
  help?: string;
  /**
   * Presentation hint, e.g. `position_grid` on the banner's nine-value select.
   *
   * Deliberately a bare `string`, not a union: it is advice about how to *draw*
   * a control, never about what the field means or what it sends. The renderer
   * treats an unrecognised value as absent and falls back to the plain control
   * for `type`, so the server can start sending a new hint at any time without
   * a frontend deploy and without any risk of a dead field.
   */
  control?: string;
  /**
   * `group_list` only: the fields of a single entry.
   *
   * Served in exactly the same shape as a block's own `fields` — a list of
   * objects each carrying `name` — and flattened recursively server-side, so
   * the same normaliser and the same renderer handle both, at any depth. That
   * sameness is the whole point of the field type: a container costs one
   * renderer, not a parallel vocabulary.
   */
  itemFields?: CampaignFieldSpec[];
  /**
   * `group_list` only: server-declared ceiling on entries (24 for cards).
   *
   * There is deliberately no `minItems`. No field declares one and nothing
   * enforces one server-side, so imposing a floor here would invent a rule the
   * server doesn't share — the marketer would be blocked by the editor on
   * something the send accepts.
   */
  maxItems?: number;
};

export type CampaignBlockSpec = {
  type: string;
  label: string;
  description?: string;
  fields: CampaignFieldSpec[];
};

export type CampaignThemeSpec = { key: string; label: string };

export type CampaignMergeTagSpec = {
  /** Bare name, e.g. FIRST_NAME. */
  tag: string;
  label: string;
  /**
   * Suggested fallback. Most of the imported list has an email and nothing
   * else, so the editor always inserts `[[TAG|fallback]]` rather than a bare
   * tag — a bare one sends "Hi ," to much of the list.
   */
  fallback?: string;
};

/**
 * `GET /admin/campaign-design` — the editor is generated from this, so a block
 * type added server-side appears without a frontend change. Normalised by
 * `lib/campaign-design.ts`, which tolerates several plausible key spellings.
 */
export type CampaignDesign = {
  blocks: CampaignBlockSpec[];
  themes: CampaignThemeSpec[];
  mergeTags: CampaignMergeTagSpec[];
};

/** A block instance in a campaign: `{ type, ...fieldValues }`. */
export type CampaignBlock = { type: string } & Record<string, unknown>;

export type CampaignTemplate = {
  id: number | string;
  name: string;
  description?: string | null;
  blocks: CampaignBlock[];
  theme?: CampaignThemeValue;
  /** Starters are built-in and can't be edited or deleted. */
  is_starter?: boolean;
  /**
   * Server-rendered email, byte-identical to what the import returned.
   *
   * Present on `GET /admin/campaign-templates/{id}` and on each starter — **not**
   * on the list, which stays light. Render this rather than deriving a preview
   * from `blocks`: the renderer is the only thing that knows the current block
   * vocabulary, and the editor is routinely a deploy behind it.
   */
  preview_html?: string | null;
  preview_text?: string | null;
  /** Present on the list in place of `blocks`. */
  block_count?: number | null;
};

/**
 * Result of importing an InDesign HTML export as a campaign template.
 *
 * `saved: false` is a dry run — nothing was written and `template_id` is absent.
 * `theme` arrives as an object here (`{ preset, text_color, … }`) rather than the
 * bare preset key the composer uses; put it through `themeToKey()`.
 *
 * `warnings` are written for the marketer, not the developer, and must be shown.
 */
export type CampaignImportResult = {
  saved: boolean;
  template_id?: number;
  name?: string;
  blocks: CampaignBlock[];
  theme?: CampaignThemeValue;
  media?: CampaignImportMedia[];
  warnings?: string[];
  source?: { document?: string; text_frames?: number; images_seen?: number };
  /** The real rendered email — ready to put straight in a sandboxed iframe. */
  preview_html?: string;
};

export type CampaignImportMedia = {
  media_id: number;
  url: string;
  width?: number | null;
  height?: number | null;
  filename?: string | null;
};

export type CampaignPreview = {
  html: string;
  html_personalized: string;
  text: string;
  subject_personalized: string;
  /** e.g. a typo'd `[[FIRSTNAME]]` — surfaced before 1,700 emails go out blank. */
  unknown_merge_tags: string[];
};

/**
 * The campaign theme. The composer holds a bare preset key (that's what the
 * design schema and the send endpoint use); draft storage documents the object
 * form `{ preset }`. Both are accepted on read — see `themeToKey`/`themeToWire`
 * in `hooks/use-campaign-autosave.ts`.
 */
export type CampaignThemeValue = string | { preset?: string | null } | null;

/**
 * An in-progress campaign, persisted so leaving the tab doesn't lose it.
 *
 * Deliberately holds invalid, half-built work: a Button with no URL yet is
 * exactly what needs storing, so nothing here is validated on the way in.
 * Block rules still apply at preview and at send.
 *
 * The *list* endpoint returns the light shape (no `blocks`); `/latest` and
 * `/{id}` return everything. `blocks` is optional to cover the light case.
 *
 * Drafts are private to their author and capped at 20 each, oldest pruned —
 * so another admin's id reads as 404, and an id can legitimately vanish
 * between sessions.
 */
export type CampaignDraft = {
  id: number;
  /** Server-side display label for the restore list — sent as `name`, returned as `label`. */
  label?: string | null;
  name?: string | null;
  subject?: string | null;
  blocks?: CampaignBlock[] | null;
  block_count?: number;
  /** Backend's own emptiness verdict — authoritative over any client heuristic. */
  is_empty?: boolean;
  theme?: CampaignThemeValue;
  body_html?: string | null;
  filters?: BulkEmailFilters | null;
  created_at?: string;
  updated_at?: string;
};

export type BulkEmail = {
  id: number;
  subject: string;
  body_html?: string | null;
  /** Set when the campaign was authored from blocks — enables Reopen/Duplicate. */
  designed?: boolean;
  blocks?: CampaignBlock[] | null;
  theme?: string | null;
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

/* ─── Partner Sales Log ──────────────────────────────────────────────────────
   Overseas partners reporting what they sold, replacing paper reports.
   Frontend app: okelcor-gmbh/okelcor-partner (partners.okelcor.com).
   Contract: that repo's docs/BACKEND_NOTE_partner_sales.md                  */

export type PartnerOrganisation = {
  id: number;
  name: string;
  country: string;
  country_code: string;
  default_currency: string;
  status?: string;
  users_count?: number;
  sales_count?: number;
  created_at?: string;
};

export type PartnerUser = {
  id: number;
  partner_org_id: number;
  name: string;
  phone: string;
  is_active: boolean;
  must_change_pin: boolean;
  locked_until?: string | null;
  last_login_at?: string | null;
};

export type PartnerSaleRecord = {
  id: number;
  client_generated_id: string;
  partner_org_id: number;
  partner_name?: string;
  entered_by?: string | null;
  sold_at: string;
  size: string;
  brand?: string | null;
  tyre_type: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  currency: string;
  customer_name?: string | null;
  notes?: string | null;
  status: "submitted" | "verified" | "disputed";
  deleted?: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at?: string;
};

/**
 * Totals are grouped by currency and never summed across them — partners sell
 * in NGN, GHS, KES, AED and more, nothing converts, and a single combined
 * figure would be meaningless while looking authoritative.
 */
export type PartnerSalesTotals = {
  currency: string;
  total: number;
  pieces: number;
  entries: number;
}[];

/* ─── Operations board & finance reconciliation (Session 83) ─────────────────
   The finance director's grid: one row per sales channel, seven columns, plus
   the invoice gap between what this system issued and what sevDesk raised. */

export type OperationsChannelRow = {
  channel: "normal" | "ebay" | "all" | string;
  label: string;
  orders_sent: number;
  /** EUR only — see `amount_other_currencies`. Nothing is converted. */
  amount: number;
  currency: string;
  /**
   * Amounts booked in other currencies, listed rather than converted: at
   * today's rate a historic month's revenue would change every time the board
   * is opened.
   */
  amount_other_currencies?: { currency: string; amount: number; orders: number }[] | null;
  /** Distinct buyers. NOT summable across rows — see `OperationsSummary.total`. */
  clients: number;
  orders_confirmed: number;
  website_invoices: number;
  finance_invoices: number;
  /** The point of the two invoice columns. Non-zero must be visually distinct. */
  invoice_variance: number;
  /** The whole fulfilment window — see `AdminOrder.in_transit` for the change. */
  in_transit: number;
  /** The two halves of it, so the pre-session-87 figure is still readable. */
  ready_to_ship?: number | null;
  shipped?: number | null;
};

export type OperationsSummary = {
  period: { from: string; to: string; label: string };
  channels: OperationsChannelRow[];
  /**
   * The "All channels" row — **not** the sum of the channel rows. One buyer who
   * ordered on eBay and on the website is one client; adding the rows reports
   * two. Served, never computed here.
   */
  total: OperationsChannelRow;
  /**
   * Column definitions written for the reader. Rendered verbatim as tooltips:
   * seven figures two departments will argue over are worthless if "orders
   * sent" means something different to the reader than to the query.
   */
  definitions?: Record<string, string> | null;
};

export type OperationsSummaryMeta = {
  /**
   * False until the finance migration runs. The finance column is then a
   * structural zero, not a real one — say "not switched on yet", never "0".
   */
  finance_recording_available?: boolean;
  channels?: string[];
};

/** A row finance typed in from sevDesk. Not an integration, on purpose. */
export type FinanceInvoice = {
  id: number;
  external_number: string;
  issued_on: string;
  order_ref?: string | null;
  invoice_number?: string | null;
  amount?: number | null;
  currency?: string | null;
  channel?: string | null;
  notes?: string | null;
  /**
   * `order_ref` is deliberately not validated against our orders — an invoice
   * finance cannot match to an order here is exactly the row worth recording.
   */
  order_known_here?: boolean | null;
  matched?: boolean | null;
  created_at?: string | null;

  /**
   * Which system raised it. `okelcor` rows are written by this API when it
   * issues a tax invoice, or a commercial invoice / proforma to a customer —
   * that second case was the real gap, since it is an invoice as far as the
   * customer is concerned but had no row on either side of the reconciliation.
   *
   * **The board and the reconciliation still count only finance's manual
   * entries**, so neither needed changing: counting our own auto-registered
   * rows as finance's would make the variance read zero however far apart the
   * two systems actually were.
   */
  system?: "sevdesk" | "okelcor" | "upload" | "other" | string | null;
  /**
   * Written by the system, following the document behind it. **Read-only** —
   * PATCH and DELETE return 409 `auto_registered`, and deleting one would only
   * mean it reappears the next time that invoice is saved.
   */
  auto_registered?: boolean | null;
  source_type?: string | null;
  source_id?: number | null;

  /** The sevDesk PDF, when finance attached one. */
  has_file?: boolean | null;
  file_name?: string | null;
  file_size?: number | null;
  uploaded_at?: string | null;
};

export type InvoiceReconciliation = {
  available: boolean;
  reason?: string | null;
  counts: {
    website_invoices: number;
    finance_invoices: number;
    matched: number;
    only_here: number;
    only_in_finance: number;
    /** Two systems holding the same invoice at different money. */
    amount_mismatch: number;
  };
  matched: {
    order_ref?: string | null;
    our_invoice?: string | null;
    finance_invoice?: string | null;
    our_amount?: number | null;
    finance_amount?: number | null;
    amount_matches?: boolean | null;
  }[];
  only_here: {
    invoice_number?: string | null;
    order_ref?: string | null;
    amount?: number | null;
    issued_at?: string | null;
  }[];
  only_in_finance: {
    external_number?: string | null;
    order_ref?: string | null;
    order_known_here?: boolean | null;
    amount?: number | null;
    issued_on?: string | null;
  }[];
};


/* ─── Operations: clients drill-down & transaction report (Session 86) ───── */

export type OperationsClient = {
  /** The identity. A buyer who never registered has this and nothing else. */
  email: string;
  name?: string | null;
  country?: string | null;
  orders_count: number;
  amount: number;
  currency?: string | null;
  other_currency_orders?: number | null;
  first_order_at?: string | null;
  last_order_at?: string | null;
  channels?: string[] | null;
  /**
   * Null for a buyer with no account — which is normal, not an error: plenty of
   * confirmed orders belong to people who never registered. **Never render a
   * customer link when this is null**; the page would 404.
   */
  customer_id?: number | null;
  company?: string | null;
  buyer_tier?: string | null;
  onboarding_status?: string | null;
  has_account?: boolean | null;
};

export type OperationsClientOrder = {
  order_ref: string;
  channel?: string | null;
  status?: string | null;
  payment_status?: string | null;
  total?: number | null;
  currency?: string | null;
  created_at?: string | null;
  in_transit?: boolean | null;
};

export type OperationsClientDetail = {
  client: OperationsClient;
  totals: {
    orders_count: number;
    amount: number;
    currency?: string | null;
    /** The actionable one: orders of theirs that need trade documents sent. */
    in_transit: number;
  };
  orders: OperationsClientOrder[];
};

export type OperationsReportChange = {
  from?: string | null;
  to?: string | null;
  metrics: Record<string, {
    previous: number;
    current: number;
    delta: number;
    /**
     * **Null off a zero baseline** — a change from nothing is undefined, not
     * large. Render "—" or "new", never "+100%", which reads as a fact.
     */
    percent: number | null;
    direction?: "up" | "down" | "flat" | string | null;
  }>;
};

export type OperationsReport = {
  period: { from: string; to: string };
  granularity: "day" | "week" | "month" | string;
  /**
   * True when no specific channel was asked for. **Branch on it** — when a
   * channel *is* requested this is false, `periods` carry no `channels` key and
   * only `channel: "all"` datasets come back. Three datasets per metric where
   * two are empty is a legend full of lines that aren't there.
   */
  channel_split?: boolean | null;
  periods: {
    key: string;
    label: string;
    orders_sent: number;
    orders_confirmed: number;
    amount: number;
    currency?: string | null;
    clients: number;
    /** Present only when `channel_split` is true. */
    channels?: Record<string, {
      orders_sent: number;
      orders_confirmed: number;
      amount: number;
      clients: number;
    }> | null;
  }[];
  change?: OperationsReportChange | null;
  totals?: {
    orders_sent?: number;
    orders_confirmed?: number;
    amount?: number;
    /** Not the sum of the client column — one buyer over two months is one client. */
    clients?: number;
    periods?: number;
  } | null;
  /**
   * Already shaped for a chart: parallel arrays on a shared label axis. Fed
   * straight in and never rebuilt from `periods` — two places that aggregate
   * are two places that can disagree about a number the business is reading.
   */
  series?: {
    labels: string[];
    datasets: {
      metric: string;
      /** `all` | `normal` | `ebay`. Filter by metric first, then by channel. */
      channel?: string | null;
      label: string;
      data: number[];
    }[];
  } | null;
  note?: string | null;
};

// ── Staff contribution ledger (session 89) ───────────────────────────────────
//
// Two shapes, kept apart on purpose. `StaffActivity` is work the API watched
// happen; `StaffContribution` is work the person entered. There is deliberately
// no type that combines them, and no field anywhere that totals both — the
// promise made to the team is that observed and self-entered work never merge
// into one figure, and a union type here would be the first place that erodes.

export type StaffActivity = {
  id: number;
  category: string;
  category_label: string;
  action: string;
  action_label: string;
  /** `order` | `trade_document` | `customer` | `campaign` | `finance_invoice` | `partner_sale` */
  subject_type: string | null;
  subject_id: number | null;
  subject_label: string | null;
  occurred_at: string | null;
  metadata: Record<string, string | number | null> | null;
  /** Always true. Stated per row so a contribution can never be rendered as one. */
  verified: true;
};

export type StaffMember = {
  id: number;
  name: string;
  email: string;
  /**
   * What the person does. Render this, not `role` — the role is a permission
   * set, and two order managers plus the person running operations all hold
   * `admin` because all three need customers, campaigns and quote requests.
   */
  job_title: string;
  role: string;
  is_active: boolean;
  is_self: boolean;
};

export type StaffCategoryCount = {
  category: string;
  label: string;
  total: number;
};

export type StaffSummary = {
  admin_user: { id: number; name: string; job_title: string; role: string };
  from: string;
  to: string;
  recorded: {
    total: number;
    by_category: StaffCategoryCount[];
    top_actions: { action: string; label: string; total: number }[];
    /**
     * Distinct days with any recorded activity. Not a productivity measure and
     * must not be labelled as one — it answers "was this a normal month or a
     * fortnight of leave", which is the context every other count needs.
     */
    active_days: number;
  };
  self_reported: {
    /** False until migration #38 runs. Hide the panel rather than showing zeros. */
    available: boolean;
    total: number;
    verified: number;
    pending: number;
    rejected: number;
    by_category: StaffCategoryCount[];
  };
  note: string;
};

export type StaffContributionStatus = "pending" | "verified" | "rejected";

export type StaffContribution = {
  id: number;
  category: string;
  category_label: string;
  title: string;
  description: string | null;
  performed_on: string;
  minutes: number | null;
  link: string | null;
  has_file: boolean;
  file_name: string | null;
  file_size: number | null;
  has_evidence: boolean;
  status: StaffContributionStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  logged_by: { id: number; name: string | null; role: string | null };
  created_at: string | null;
  /** Always true, including once verified. A countersigned claim is still a claim. */
  self_reported: true;
  /**
   * Computed by the API for this viewer. Drive the buttons off these rather
   * than off `status` plus a permission guess — otherwise the two drift.
   */
  can_edit: boolean;
  can_review: boolean;
};

/**
 * A person in the team report.
 *
 * `job_title` is what to render. `role` is a permission set and describes
 * nobody's job — two order managers and the person running operations all hold
 * `admin`, because all three need customers, campaigns and quote requests.
 * Show the role only where access is genuinely the subject.
 */
export type StaffReportPerson = {
  admin_user_id: number;
  name: string;
  email: string;
  job_title: string;
  /** False when the title above is a fallback derived from the role. */
  job_title_set: boolean;
  role: string;
  recorded: { total: number; by_category: StaffCategoryCount[] };
  self_reported: { total: number; verified: number; pending: number; rejected: number };
};

export type StaffTeamReport = {
  from: string;
  to: string;
  /** Alphabetical. There is no ranking here and none should be introduced. */
  people: StaffReportPerson[];
  totals: {
    people: number;
    people_with_activity: number;
    recorded: number;
    self_reported: number;
    awaiting_review: number;
  };
  /** Travels with the payload because this report gets exported and forwarded. */
  caveats: string[];
};

// ── Order profitability & weekly liquidity (Session 99) ───────────────────────

/** The compact block embedded on GET /admin/orders/{id}. */
export type OrderFinanceSummary = {
  has_revenue_invoice: boolean;
  revenue_invoice_number?: string | null;
  revenue_amount?: number | null;
  customer_agreed?: boolean;
  costs_total: number;
  cost_lines: number;
  profit?: number | null;
  margin_percent?: number | null;
  currency: string;
  verified: boolean;
};

export type OrderCostLine = {
  id: number;
  /** 'supplier_invoice' or 'fee'. */
  kind: string;
  /** Fees only: stripe | ebay | bank | shipping | other. Null on supplier invoices. */
  category?: string | null;
  supplier?: string | null;
  /** The supplier's own invoice number. Free text, deliberately not unique. */
  reference?: string | null;
  amount: number;
  currency: string;
  incurred_on?: string | null;
  notes?: string | null;
  has_file?: boolean | null;
  file_name?: string | null;
  uploaded_at?: string | null;
  entered_by?: string | null;
  created_at?: string | null;
};

/** GET /admin/orders/{id}/profitability. */
export type OrderProfitability = {
  /** Null until finance records the finalized, customer-agreed invoice. */
  revenue: {
    invoice_number?: string | null;
    amount: number | null;
    currency: string;
    issued_on?: string | null;
    finalized_at?: string | null;
    customer_agreed_at?: string | null;
    has_file: boolean;
    file_name?: string | null;
    uploaded_at?: string | null;
    set_by?: string | null;
    /** Invoiced minus ordered — the figure finance reconciles. Null across currencies. */
    variance_from_order_total?: number | null;
  } | null;
  costs: {
    supplier_total: number;
    fees_total: number;
    total: number;
    currency: string;
    by_category: Record<string, number>;
    lines_count: number;
    /** Costs in other currencies: named, excluded from the totals, never converted. */
    other_currencies: Record<string, number>;
  };
  profit: {
    /** Null until a revenue invoice exists — unknown, not zero. */
    amount: number | null;
    margin_percent: number | null;
    currency: string;
    mixed_currency: boolean;
  };
  verification: {
    verified: boolean;
    verified_at?: string | null;
    verified_by?: string | null;
    note?: string | null;
  };
  lines: OrderCostLine[];
  /** What the rest of the system already believes about this order's money. */
  context?: {
    order_total: number;
    order_currency: string;
    order_status: string;
    counts_as_confirmed: boolean;
    customer_acceptance_status?: string | null;
    customer_accepted_at?: string | null;
    system_invoice_number?: string | null;
    system_invoice_amount?: number | null;
  };
};

/** One row of GET /admin/finance/profitability. */
export type ProfitabilityRow = {
  order_id: number;
  order_ref: string;
  order_date?: string | null;
  channel?: string | null;
  customer_name?: string | null;
  status: string;
  order_total: number;
  order_currency: string;
  revenue_invoice_number?: string | null;
  revenue_amount?: number | null;
  revenue_has_file?: boolean | null;
  supplier_costs: number;
  fees: number;
  costs_total: number;
  profit?: number | null;
  margin_percent?: number | null;
  currency: string;
  mixed_currency?: boolean | null;
  verified: boolean;
  verified_by?: string | null;
  verified_at?: string | null;
};

export type ProfitabilityDashboardMonth = {
  key: string;
  label: string;
  orders: number;
  orders_with_revenue: number;
  order_total_eur: number;
  revenue_eur: number;
  supplier_costs_eur: number;
  fees_eur: number;
  costs_eur: number;
  profit_eur: number;
  /** Null when the month has no revenue — undefined, not 0%. */
  margin_percent: number | null;
  verified: number;
  /** Counted, never converted. */
  non_eur_orders: number;
};

export type ProfitabilityDashboard = {
  year: number;
  period: { from: string; to: string };
  months: ProfitabilityDashboardMonth[];
  totals: Omit<ProfitabilityDashboardMonth, "key" | "label">;
  /** Every figure's meaning, served with the numbers — render as tooltips. */
  definitions: Record<string, string>;
};

/**
 * One ISO week of the liquidity ladder ('2026-W35'). The planner returns the
 * current week + 3; the window rolls by the calendar, not by anything anyone
 * runs, and finished weeks live under /history.
 */
export type LiquidityWeekRow = {
  week_key: string;
  label: string;
  iso_year?: number;
  iso_week?: number;
  starts_on: string;
  ends_on: string;
  is_current?: boolean;
  /** False = no row saved yet — an empty editable week, not an error. */
  recorded?: boolean;
  bank_balance: number | null;
  expected_in: number | null;
  expected_out: number | null;
  /** Chains: opens on the entered balance or the previous week's close. */
  projected_closing?: number | null;
  notes?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
};

// ── EC Invoice List — Zusammenfassende Meldung (Session 100) ─────────────────

export type EcInvoiceLine = {
  id: number;
  group_id: number;
  invoice_number: string;
  invoice_date?: string | null;
  amount: number;
  assigned_admin_id?: number | null;
  /** The tagged staff member's name, or the typed display name. */
  person?: string | null;
  /** complete | pending_doc | review. */
  task_status: string;
  has_invoice_file: boolean;
  invoice_file_name?: string | null;
  has_proof_file: boolean;
  proof_file_name?: string | null;
};

export type EcInvoiceGroup = {
  id: number;
  period: string;
  country_code: string;
  customer_vat_id: string;
  /** goods | services | triangular | export. */
  transaction_type: string;
  type_label: string;
  /**
   * Third-country export (Session 105) — listed and audited here, badged in
   * the table, and EXCLUDED from the ELSTER XML: § 18a covers intra-EU
   * supplies only.
   */
  is_export: boolean;
  /** The sum of the lines — never stored, computed server-side. */
  total: number;
  lines: EcInvoiceLine[];
};

export type EcInvoicePeriodState = {
  period: string;
  /** draft | ready | submitted. */
  status: string;
  submitted_at?: string | null;
};

export type EcInvoiceMeta = {
  ec_invoices_available: boolean;
  company_vat_id: string;
  countries: string[];
  /** `art` is null for `export` — no § 18a code, and no ZM line. */
  types: { key: string; label: string; art: string | null }[];
  statuses: { key: string; label: string }[];
  period_statuses: string[];
  staff: { id: number; name: string }[];
  known_periods: string[];
};

// ── Sales & Order Management board (Session 101) ─────────────────────────────

export type SalesBoardLine = {
  id: number;
  /** customer (revenue + tyres) | supplier (cost + document). */
  party_type: string;
  party_name: string;
  /** Per-line invoice number, e.g. the supplier invoice or the credit note ref. */
  invoice_no?: string | null;
  tyre_qty: number;
  amount: number;
  has_file: boolean;
  file_name?: string | null;
};

export type SalesBoardEntry = {
  id: number;
  order_no: string;
  customer_name: string;
  /** B2B | B2C. */
  segment: string;
  /** 'YYYY-MM'. */
  period: string;
  /** Tyres | FET. */
  category: string;
  /** verified | pending_proof — computed from the lines, never stored. */
  status: string;
  revenue: number;
  costs: number;
  gross_profit: number;
  /** Null when there is no revenue — undefined, not 0%. */
  margin_percent: number | null;
  tyres: number;
  lines: SalesBoardLine[];
};

export type SalesBoardKpis = {
  unique_customers: number;
  tyres_sold: number;
  avg_price_per_tyre: number | null;
  b2b_margin_percent: number | null;
  b2c_margin_percent: number | null;
};

export type SalesBoardMeta = {
  sales_orders_available: boolean;
  segments: string[];
  categories: string[];
  known_periods: string[];
};

// ── Team to-do list (Session 102) ────────────────────────────────────────────

export type TodoItem = {
  id: number;
  title: string;
  details?: string | null;
  /** The assignee's note back (Session 108) — separate from the brief. */
  assignee_note?: string | null;
  due_on?: string | null;
  overdue: boolean;
  /** low | normal | high. */
  priority: string;
  /** open | in_progress | done. */
  status: string;
  assigned_admin_id?: number | null;
  assignee?: string | null;
  created_by?: number | null;
  creator?: string | null;
  /**
   * Which part of the business raised it (Session 109). Derived from the
   * role STAMPED on the to-do at creation, not from the creator's current
   * one — so it survives a role change and the account being deleted.
   */
  created_by_role?: string | null;
  department?: string | null;
  completed_at?: string | null;
  completed_by_name?: string | null;
  created_at?: string | null;
  /** Served, not derived — the participant rules live server-side. */
  you_may_edit: boolean;
  you_may_delete: boolean;
};

export type TodoMeta = {
  todos_available: boolean;
  priorities: string[];
  statuses: { key: string; label: string }[];
  open_count: number;
  /** Department name → count. Only departments that actually have to-dos. */
  departments?: Record<string, number>;
  staff: { id: number; name: string }[];
};

// ── After-sales claims queue (Session 119) ────────────────────────────────────

export type ClaimItem = {
  id: number;
  /** CLM-00001 — stamped server-side from the id. */
  ref: string | null;
  order_id?: number | null;
  order_number?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_company?: string | null;
  type: string;
  type_label: string;
  description: string;
  quantity?: number | null;
  /** new | in_review | awaiting_customer | approved | rejected | closed. */
  status: string;
  status_label: string;
  outcome_note?: string | null;
  assigned_admin_id?: number | null;
  assignee?: string | null;
  created_by?: number | null;
  creator?: string | null;
  resolved_at?: string | null;
  resolved_by_name?: string | null;
  closed_at?: string | null;
  created_at?: string | null;
  /** Days from logged to decided (or to now, while open). */
  age_days?: number | null;
};

export type ClaimMeta = {
  claims_available: boolean;
  counts?: Record<string, number>;
  open_count?: number;
  /** Logged → approved/rejected, last 90 days. Null until something decided. */
  avg_days_to_decision?: number | null;
  types?: { key: string; label: string }[];
  statuses?: { key: string; label: string }[];
  staff?: { id: number; name: string }[];
};
