/**
 * Customer notification model + UI helpers (customer portal "inbox").
 *
 * Design principle (see docs/BACKEND-CUSTOMER-NOTIFICATIONS.md):
 *   Every transactional email the backend sends to a customer (order placed,
 *   payment milestone, document ready, quote/proposal, account approval, …)
 *   ALSO writes a customer_notifications row with the same subject/body. The
 *   portal then surfaces that history as an in-app inbox so the customer never
 *   has to dig through their email to track an order.
 *
 * This mirrors the admin CRM-3B notification system (lib/admin-notifications.ts)
 * but is a self-contained customer-facing model — it intentionally does NOT
 * import admin types or expose any internal risk/health data.
 */
import { createElement } from "react";
import {
  Bell, Package, FileCheck2, CreditCard, Truck, PackageCheck,
  FileText, ClipboardList, BadgeCheck, KeyRound, ShieldCheck,
  Sparkles, Megaphone, Quote,
  type LucideIcon, type LucideProps,
} from "lucide-react";

// ─── Model ──────────────────────────────────────────────────────────────────────

export type CustomerNotificationSeverity = "info" | "success" | "warning" | "urgent";

/**
 * Notification categories. Each one maps to a transactional email the backend
 * already sends (or will send). Unknown strings render with a sensible default,
 * so the backend can add new categories without a frontend deploy.
 */
export type CustomerNotificationType =
  | "order_placed"          // order received / confirmation email
  | "order_confirmation"    // Order Confirmation (AB) issued — awaiting acceptance
  | "order_confirmed"       // customer accepted / order confirmed
  | "payment_milestone"     // deposit due/received, balance due/received, shipment released
  | "order_shipped"         // shipment dispatched + tracking
  | "order_delivered"       // delivery confirmation
  | "quote_received"        // quote request received
  | "quote_ready"           // proposal sent / quote ready to view
  | "proposal_reminder"     // pending proposal reminder
  | "document_ready"        // invoice / packing list / commercial invoice available
  | "account_approved"      // B2B onboarding approved
  | "access_request_update" // access request approved / rejected
  | "verification_update"   // verification added / approved / rejected
  | "security_alert"        // password changed, new sign-in
  | "welcome"               // welcome / email verified
  | "announcement"          // general announcement / campaign
  | (string & {});

export type CustomerNotificationRelatedType =
  | "order" | "quote_request" | "proposal" | "trade_document"
  | "access_request" | "verification" | "account"
  | (string & {});

export type CustomerNotification = {
  id: number;
  type: CustomerNotificationType;
  /** Subject line — mirrors the email subject. */
  title: string;
  /** Body preview — mirrors the email summary. */
  body?: string | null;
  severity?: CustomerNotificationSeverity | null;
  /** In-app deep link (e.g. /account/orders/AB-1024). */
  action_url?: string | null;
  related_type?: CustomerNotificationRelatedType | null;
  related_id?: number | string | null;
  read_at?: string | null;
  dismissed_at?: string | null;
  /** Set when the same notification was also delivered by email — drives the "Emailed" tag. */
  email_sent_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

/** Customer-controllable delivery preferences (per category group). */
export type CustomerNotificationPreferences = {
  /** Master switch for in-app inbox notifications. */
  inapp_enabled?: boolean;
  /** Master switch for transactional emails. */
  email_enabled?: boolean;
  /** Per-group email opt-in. Transactional groups (orders/payments/documents) should stay on. */
  email_orders?: boolean;
  email_quotes?: boolean;
  email_documents?: boolean;
  email_account?: boolean;
  email_marketing?: boolean;
};

// ─── Field accessors (forward-compatible with the admin shape) ───────────────────

export function notifBody(n: CustomerNotification): string | null {
  return n.body ?? null;
}

export function notifLink(n: CustomerNotification): string | null {
  return n.action_url ?? null;
}

export function isEmailed(n: CustomerNotification): boolean {
  return Boolean(n.email_sent_at);
}

/** True when the notification deep-links to a live delivery map (metadata.live_tracking). */
export function isLiveTracking(n: CustomerNotification): boolean {
  return n.metadata?.live_tracking === true;
}

// ─── Severity → colour tokens (Okelcor orange for "info") ────────────────────────

type SeverityStyle = { dot: string; chip: string; icon: string; ring: string };

const SEVERITY_STYLES: Record<CustomerNotificationSeverity, SeverityStyle> = {
  info:    { dot: "bg-[var(--primary)]", chip: "bg-[#fff5f3] text-[var(--primary)] border-[var(--primary)]/20", icon: "text-[var(--primary)]", ring: "bg-[var(--primary)]/[0.05]" },
  success: { dot: "bg-emerald-500",      chip: "bg-emerald-50 text-emerald-700 border-emerald-200",            icon: "text-emerald-600",      ring: "bg-emerald-500/[0.05]" },
  warning: { dot: "bg-amber-500",        chip: "bg-amber-50 text-amber-700 border-amber-200",                  icon: "text-amber-600",        ring: "bg-amber-500/[0.05]" },
  urgent:  { dot: "bg-red-500",          chip: "bg-red-50 text-red-700 border-red-200",                        icon: "text-red-600",          ring: "bg-red-500/[0.05]" },
};

export function severityStyle(severity?: CustomerNotificationSeverity | null): SeverityStyle {
  return SEVERITY_STYLES[severity ?? "info"] ?? SEVERITY_STYLES.info;
}

// ─── Type → icon ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, LucideIcon> = {
  order_placed:          Package,
  order_confirmation:    FileCheck2,
  order_confirmed:       BadgeCheck,
  payment_milestone:     CreditCard,
  order_shipped:         Truck,
  order_delivered:       PackageCheck,
  quote_received:        Quote,
  quote_ready:           ClipboardList,
  proposal_reminder:     ClipboardList,
  document_ready:        FileText,
  account_approved:      BadgeCheck,
  access_request_update: ShieldCheck,
  verification_update:   ShieldCheck,
  security_alert:        KeyRound,
  welcome:               Sparkles,
  announcement:          Megaphone,
};

/**
 * Renders the icon for a notification type. Module-scope so the component is
 * never re-created during a parent render (react-hooks/static-components).
 */
export function NotifIcon({ type, ...props }: { type: string } & LucideProps) {
  return createElement(TYPE_ICONS[type] ?? Bell, props);
}

// ─── Human-readable category label (for filters + the "from" line) ───────────────

export const TYPE_LABELS: Record<string, string> = {
  order_placed:          "Order received",
  order_confirmation:    "Order confirmation",
  order_confirmed:       "Order confirmed",
  payment_milestone:     "Payment",
  order_shipped:         "Shipment",
  order_delivered:       "Delivery",
  quote_received:        "Quote request",
  quote_ready:           "Quote ready",
  proposal_reminder:     "Proposal reminder",
  document_ready:        "Document ready",
  account_approved:      "Account approved",
  access_request_update: "Access request",
  verification_update:   "Verification",
  security_alert:        "Security",
  welcome:               "Welcome",
  announcement:          "Announcement",
};

export function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? "Notification";
}

// ─── Relative time ───────────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
}
