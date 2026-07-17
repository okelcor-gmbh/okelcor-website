/**
 * Shared helpers for the AI-generated admin insights UI (bell + toast).
 * See docs/BACKEND_NOTE_ai_insights.md for the backend contract this renders.
 */
import { createElement, Fragment, type ReactNode } from "react";
import type { AdminInsightCategory, AdminInsightSeverity } from "@/lib/admin-api";

type SeverityStyle = { bar: string; chip: string; icon: string; tint: string };

const SEVERITY_STYLES: Record<AdminInsightSeverity, SeverityStyle> = {
  positive: { bar: "bg-emerald-500", chip: "bg-emerald-50", icon: "text-emerald-600", tint: "bg-emerald-50/50" },
  info:     { bar: "bg-[#E85C1A]",   chip: "bg-[#fff1ec]",  icon: "text-[#E85C1A]",   tint: "bg-white" },
  warning:  { bar: "bg-amber-500",   chip: "bg-amber-50",   icon: "text-amber-600",   tint: "bg-amber-50/50" },
  critical: { bar: "bg-red-500",     chip: "bg-red-50",     icon: "text-red-600",     tint: "bg-red-50/50" },
};

export function severityStyle(severity?: AdminInsightSeverity | null): SeverityStyle {
  return SEVERITY_STYLES[severity ?? "info"] ?? SEVERITY_STYLES.info;
}

const CATEGORY_LABELS: Record<string, string> = {
  revenue: "Revenue", orders: "Orders", inventory: "Inventory",
  security: "Security", traffic: "Traffic", quotes: "Quotes",
};

export function categoryLabel(category: AdminInsightCategory): string {
  return CATEGORY_LABELS[category] ?? (category.charAt(0).toUpperCase() + category.slice(1));
}

/**
 * Renders **bold** markdown-lite spans in AI-generated detail text as <strong>.
 * Deliberately narrow — one bold key clause per sentence, not a full markdown parser.
 */
export function renderInsightDetail(
  text: string,
  boldClassName = "font-semibold text-[#1a1a1a]"
): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) =>
      i % 2 === 1 ? createElement("strong", { key: i, className: boldClassName }, part) : part
    )
  );
}
