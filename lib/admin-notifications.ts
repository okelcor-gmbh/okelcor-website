/**
 * CRM-3B: shared helpers for admin notification UI (bell + notifications center).
 *
 * The backend contract (CRM-3B) uses `body` / `action_url` / `severity`; the
 * original CRM-3 backend used `message` / `link`. Accessors below read the new
 * field first and fall back to the legacy one so both shapes render correctly.
 */
import { createElement } from "react";
import {
  Bell, UserPlus, CalendarClock, CheckCircle2, ShieldQuestion,
  UserCheck, FileWarning, CreditCard, FileText,
  type LucideIcon, type LucideProps,
} from "lucide-react";
import type { AdminNotification, AdminNotificationSeverity } from "@/lib/admin-api";

export function notifBody(n: AdminNotification): string | null {
  return n.body ?? n.message ?? null;
}

export function notifLink(n: AdminNotification): string | null {
  return n.action_url ?? n.link ?? null;
}

// ── Severity → colour tokens ───────────────────────────────────────────────────

type SeverityStyle = { dot: string; chip: string; icon: string };

const SEVERITY_STYLES: Record<AdminNotificationSeverity, SeverityStyle> = {
  info:    { dot: "bg-[#E85C1A]",  chip: "bg-blue-50 text-blue-600 border-blue-200",      icon: "text-[#E85C1A]" },
  success: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "text-emerald-600" },
  warning: { dot: "bg-amber-500",  chip: "bg-amber-50 text-amber-700 border-amber-200",   icon: "text-amber-600" },
  urgent:  { dot: "bg-red-500",    chip: "bg-red-50 text-red-700 border-red-200",         icon: "text-red-600" },
};

export function severityStyle(severity?: AdminNotificationSeverity | null): SeverityStyle {
  return SEVERITY_STYLES[severity ?? "info"] ?? SEVERITY_STYLES.info;
}

// ── Type → icon ────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, LucideIcon> = {
  lead_assigned:             UserPlus,
  follow_up_due:             CalendarClock,
  proposal_accepted:         CheckCircle2,
  proposal_rejected:         FileWarning,
  customer_access_requested: ShieldQuestion,
  customer_approval_needed:  UserCheck,
  quote_needs_review:        FileWarning,
  order_payment_milestone:   CreditCard,
  document_action_needed:    FileText,
};

/**
 * Renders the icon for a notification type. A static module-scope component so
 * the icon component is never re-created during a parent's render (which would
 * trip react-hooks/static-components).
 */
export function NotifIcon({ type, ...props }: { type: string } & LucideProps) {
  return createElement(TYPE_ICONS[type] ?? Bell, props);
}

// ── Relative time ──────────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
}
