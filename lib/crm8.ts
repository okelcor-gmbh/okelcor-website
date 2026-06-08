/**
 * CRM-8 — Buyer Approval & Customer Lifecycle Management.
 *
 * Single source of truth for buyer-tier / verification / risk vocabulary and
 * the approval-profile access matrix. Cards, modals, and tables import from
 * here so the design system stays consistent. Kept free of React/lucide so it
 * can be imported from both server and client modules.
 *
 * Safety: every CRM-8 field is optional. When the backend hasn't populated a
 * field yet (pre-migration / backfill), the UI must treat the customer as an
 * already-approved, low-risk buyer — never downgrade an existing customer.
 */

// ── Buyer tier ──────────────────────────────────────────────────────────────

export type BuyerTier = "none" | "bronze" | "silver" | "gold" | "platinum" | "vip";

export const BUYER_TIERS: BuyerTier[] = ["none", "bronze", "silver", "gold", "platinum", "vip"];

export const BUYER_TIER_LABELS: Record<string, string> = {
  none:     "No Tier",
  bronze:   "Bronze",
  silver:   "Silver",
  gold:     "Gold",
  platinum: "Platinum",
  vip:      "VIP",
};

export const BUYER_TIER_STYLES: Record<string, string> = {
  none:     "bg-gray-100 text-gray-500",
  bronze:   "bg-amber-100 text-amber-800",
  silver:   "bg-slate-200 text-slate-700",
  gold:     "bg-yellow-100 text-yellow-700",
  platinum: "bg-cyan-100 text-cyan-700",
  vip:      "bg-purple-100 text-purple-700",
};

// ── Verification status ─────────────────────────────────────────────────────

export type VerificationStatus = "not_started" | "pending_review" | "verified" | "rejected";

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  not_started:    "Not Started",
  not_submitted:  "Not Submitted",
  pending_review: "Pending Review",
  verified:       "Verified",
  rejected:       "Rejected",
};

export const VERIFICATION_STATUS_STYLES: Record<string, string> = {
  not_started:    "bg-gray-100 text-gray-500",
  not_submitted:  "bg-gray-100 text-gray-500",
  pending_review: "bg-amber-100 text-amber-700",
  verified:       "bg-emerald-100 text-emerald-700",
  rejected:       "bg-red-100 text-red-700",
};

// Verification record types (customer_verifications.type)
export type VerificationType =
  | "company_registration" | "vat_number" | "website"
  | "import_license" | "business_address" | "other";

export const VERIFICATION_TYPES: VerificationType[] = [
  "company_registration", "vat_number", "website",
  "import_license", "business_address", "other",
];

export const VERIFICATION_TYPE_LABELS: Record<string, string> = {
  company_registration: "Company Registration",
  vat_number:           "VAT Number",
  website:              "Website",
  import_license:       "Import License",
  business_address:     "Business Address",
  other:                "Other",
};

// ── Risk level ──────────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical" | "unknown";

export const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical", "unknown"];

export const RISK_LEVEL_LABELS: Record<string, string> = {
  low:      "Low Risk",
  medium:   "Medium Risk",
  high:     "High Risk",
  critical: "Critical Risk",
  unknown:  "Unknown",
};

export const RISK_LEVEL_STYLES: Record<string, string> = {
  low:      "bg-emerald-100 text-emerald-700",
  medium:   "bg-amber-100 text-amber-700",
  high:     "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
  unknown:  "bg-gray-100 text-gray-500",
};

/** Derive a risk band from a health score (UI fallback when risk_level is unset). */
export function riskFromHealth(score?: number | null): RiskLevel {
  if (score == null) return "unknown";
  if (score >= 80) return "low";
  if (score >= 60) return "medium";
  if (score >= 40) return "high";
  return "critical";
}

export function healthScoreColor(score?: number | null): string {
  if (score == null) return "bg-gray-100 text-gray-400";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-amber-100 text-amber-700";
  if (score >= 40) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

// ── Access level (shared with CRM-4) ────────────────────────────────────────

export const ACCESS_LEVEL_LABELS: Record<string, string> = {
  inquiry_only:    "Inquiry Only",
  quote_only:      "Quote Only",
  approved_buyer:  "Approved Buyer",
  wholesale_buyer: "Wholesale Buyer",
  restricted:      "Restricted",
  blocked:         "Blocked",
};

export const ACCESS_LEVEL_STYLES: Record<string, string> = {
  inquiry_only:    "bg-gray-100 text-gray-500",
  quote_only:      "bg-blue-100 text-blue-600",
  approved_buyer:  "bg-emerald-100 text-emerald-700",
  wholesale_buyer: "bg-teal-100 text-teal-700",
  restricted:      "bg-amber-100 text-amber-700",
  blocked:         "bg-red-100 text-red-700",
};

// ── Approval profiles ───────────────────────────────────────────────────────
// Mirrors the backend applyApprovalProfile() service. `tier: null` means the
// profile does not change the buyer tier. These drive the modal preview so the
// admin sees exactly what each profile changes before applying it.

export type ApprovalProfileKey =
  | "inquiry_only" | "approved_buyer" | "wholesale_buyer" | "restricted" | "blocked";

export interface ApprovalProfile {
  key: ApprovalProfileKey;
  label: string;
  description: string;
  access_level: string;
  approved_for_quotes: boolean;
  approved_for_checkout: boolean;
  approved_for_documents: boolean;
  approved_for_wholesale_pricing: boolean;
  /** null = profile leaves the tier untouched. */
  tier: BuyerTier | null;
  /** true = applying this profile revokes the customer's active sessions. */
  revokesAccess?: boolean;
  tone: "neutral" | "positive" | "warning" | "danger";
}

export const APPROVAL_PROFILES: Record<ApprovalProfileKey, ApprovalProfile> = {
  inquiry_only: {
    key: "inquiry_only",
    label: "Inquiry Only",
    description: "Can submit quote requests only. No checkout, documents, or wholesale pricing.",
    access_level: "inquiry_only",
    approved_for_quotes: true,
    approved_for_checkout: false,
    approved_for_documents: false,
    approved_for_wholesale_pricing: false,
    tier: "none",
    tone: "neutral",
  },
  approved_buyer: {
    key: "approved_buyer",
    label: "Approved Buyer",
    description: "Full buyer access — checkout and trade documents enabled. Standard retail pricing.",
    access_level: "approved_buyer",
    approved_for_quotes: true,
    approved_for_checkout: true,
    approved_for_documents: true,
    approved_for_wholesale_pricing: false,
    tier: "bronze",
    tone: "positive",
  },
  wholesale_buyer: {
    key: "wholesale_buyer",
    label: "Wholesale Buyer",
    description: "Full buyer access plus wholesale pricing. For vetted dealers, distributors, and exporters.",
    access_level: "wholesale_buyer",
    approved_for_quotes: true,
    approved_for_checkout: true,
    approved_for_documents: true,
    approved_for_wholesale_pricing: true,
    tier: "silver",
    tone: "positive",
  },
  restricted: {
    key: "restricted",
    label: "Restricted",
    description: "Quotes only. Checkout, documents, and wholesale pricing are all withheld pending review.",
    access_level: "restricted",
    approved_for_quotes: true,
    approved_for_checkout: false,
    approved_for_documents: false,
    approved_for_wholesale_pricing: false,
    tier: null,
    tone: "warning",
  },
  blocked: {
    key: "blocked",
    label: "Blocked",
    description: "All access revoked, including quotes. Active sessions are signed out immediately.",
    access_level: "blocked",
    approved_for_quotes: false,
    approved_for_checkout: false,
    approved_for_documents: false,
    approved_for_wholesale_pricing: false,
    tier: null,
    revokesAccess: true,
    tone: "danger",
  },
};

export const APPROVAL_PROFILE_LIST: ApprovalProfile[] = [
  APPROVAL_PROFILES.inquiry_only,
  APPROVAL_PROFILES.approved_buyer,
  APPROVAL_PROFILES.wholesale_buyer,
  APPROVAL_PROFILES.restricted,
  APPROVAL_PROFILES.blocked,
];

// ── Timeline events ─────────────────────────────────────────────────────────

export const TIMELINE_EVENT_LABELS: Record<string, string> = {
  customer_created:     "Customer created",
  lead_converted:       "Converted from lead",
  proposal_accepted:    "Proposal accepted",
  access_profile_applied: "Access profile applied",
  customer_approved:    "Customer approved",
  customer_rejected:    "Customer rejected",
  tier_changed:         "Buyer tier changed",
  verification_updated: "Verification updated",
  risk_level_changed:   "Risk level changed",
  customer_blocked:     "Customer blocked",
  customer_unblocked:   "Customer unblocked",
  access_requested:     "Access requested",
  access_request_approved: "Access request approved",
  access_request_rejected: "Access request rejected",
};

/** Semantic tone for a timeline event — drives the dot colour in the UI. */
export function timelineTone(eventType: string): "positive" | "warning" | "danger" | "neutral" {
  if (["customer_approved", "proposal_accepted", "lead_converted", "customer_unblocked", "access_request_approved"].includes(eventType)) return "positive";
  if (["customer_rejected", "customer_blocked", "access_request_rejected"].includes(eventType)) return "danger";
  if (["risk_level_changed", "verification_updated", "access_requested"].includes(eventType)) return "warning";
  return "neutral";
}

// ── Access requests ─────────────────────────────────────────────────────────

export type RequestedAccess = "checkout" | "documents" | "wholesale_pricing" | "higher_tier";

export const REQUESTED_ACCESS_LABELS: Record<string, string> = {
  checkout:          "Checkout Approval",
  documents:         "Trade Documents",
  wholesale_pricing: "Wholesale Pricing",
  higher_tier:       "Higher Buyer Tier",
};

export type AccessRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export const ACCESS_REQUEST_STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700",
  approved:  "bg-emerald-100 text-emerald-700",
  rejected:  "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

// ── Shared record types ─────────────────────────────────────────────────────

export interface CustomerVerification {
  id: number;
  customer_id: number;
  type: VerificationType | string;
  value?: string | null;
  status: VerificationStatus | string;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TimelineEvent {
  id: number;
  customer_id: number;
  admin_user_id?: number | null;
  admin_name?: string | null;
  event_type: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface AccessRequest {
  id: number;
  customer_id: number;
  customer_name?: string | null;
  customer_email?: string | null;
  company_name?: string | null;
  requested_access: RequestedAccess | string;
  status: AccessRequestStatus | string;
  reason?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

/** CRM-8 buyer-lifecycle fields layered on top of the customer record. */
export interface BuyerLifecycle {
  buyer_tier?: BuyerTier | string | null;
  verification_status?: VerificationStatus | string | null;
  health_score?: number | null;
  risk_level?: RiskLevel | string | null;
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  approval_notes?: string | null;
  rejection_reason?: string | null;
}
