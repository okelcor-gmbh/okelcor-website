"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type {
  AdminNotification, AdminNotificationSeverity, AdminNotificationType,
} from "@/lib/admin-api";
import {
  notifBody, notifLink, NotifIcon, severityStyle, timeAgo,
} from "@/lib/admin-notifications";
import EmptyState from "@/components/ui/empty-state";

// ── Filter options ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: AdminNotificationType | ""; label: string }[] = [
  { value: "", label: "All types" },
  { value: "lead_assigned", label: "Lead assigned" },
  { value: "follow_up_due", label: "Follow-up due" },
  { value: "proposal_accepted", label: "Proposal accepted" },
  { value: "customer_access_requested", label: "Access requested" },
  { value: "customer_approval_needed", label: "Approval needed" },
  { value: "quote_needs_review", label: "Quote needs review" },
  { value: "order_payment_milestone", label: "Payment milestone" },
  { value: "document_action_needed", label: "Document action" },
];

const SEVERITY_OPTIONS: { value: AdminNotificationSeverity | ""; label: string }[] = [
  { value: "", label: "All severities" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "urgent", label: "Urgent" },
];

const SELECT_CLS =
  "h-10 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10";

export default function NotificationsCenter() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [type, setType] = useState<AdminNotificationType | "">("");
  const [severity, setSeverity] = useState<AdminNotificationSeverity | "">("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (unreadOnly) p.set("unread", "1");
    if (type) p.set("type", type);
    if (severity) p.set("severity", severity);
    p.set("page", String(page));
    try {
      const res = await fetch(`/api/admin/notifications?${p}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [] }));
      setItems(Array.isArray(json.data) ? json.data : []);
      const lp = json.meta?.last_page;
      setLastPage(typeof lp === "number" && lp > 0 ? lp : 1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, type, severity, page]);

  useEffect(() => { void load(); }, [load]);

  // Reset to page 1 whenever a filter changes
  useEffect(() => { setPage(1); }, [unreadOnly, type, severity]);

  const markRead = useCallback((id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n))
    );
    fetch(`/api/admin/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    fetch("/api/admin/notifications/read-all", { method: "POST" })
      .then(() => load())
      .catch(() => {});
  }, [load]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    fetch(`/api/admin/notifications/${id}/dismiss`, { method: "POST" }).catch(() => {});
  }, []);

  const hasUnread = items.some((n) => !n.read_at);

  return (
    <>
      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setUnreadOnly((v) => !v)}
          className={[
            "h-10 rounded-xl px-4 text-[0.8rem] font-semibold transition",
            unreadOnly
              ? "bg-[#E85C1A] text-white"
              : "border border-black/[0.09] bg-white text-[#5c5e62] hover:border-[#E85C1A] hover:text-[#E85C1A]",
          ].join(" ")}
        >
          Unread only
        </button>

        <select className={SELECT_CLS} value={type} onChange={(e) => setType(e.target.value as AdminNotificationType | "")}>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select className={SELECT_CLS} value={severity} onChange={(e) => setSeverity(e.target.value as AdminNotificationSeverity | "")}>
          {SEVERITY_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          type="button"
          disabled={!hasUnread}
          onClick={markAllRead}
          className="ml-auto flex h-10 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-4 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CheckCheck size={14} strokeWidth={2} />
          Mark all read
        </button>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-[#E85C1A]" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            heading="No notifications"
            description={
              unreadOnly || type || severity
                ? "No notifications match the current filters."
                : "You're all caught up. New notifications will appear here."
            }
          />
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {items.map((n) => (
              <NotificationRow key={n.id} notification={n} onRead={markRead} onDismiss={dismiss} />
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {!loading && lastPage > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-9 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-[0.8rem] text-[#5c5e62]">Page {page} of {lastPage}</span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            className="flex h-9 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onRead,
  onDismiss,
}: {
  notification: AdminNotification;
  onRead: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  const unread = !notification.read_at;
  const body = notifBody(notification);
  const link = notifLink(notification);
  const sev = severityStyle(notification.severity);

  return (
    <li className={["flex items-start gap-3 px-4 py-4 transition hover:bg-[#fafafa]", unread ? "bg-[#E85C1A]/[0.03]" : ""].join(" ")}>
      <span className={["mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", sev.chip].join(" ")}>
        <NotifIcon type={notification.type} size={15} strokeWidth={1.9} className={sev.icon} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">{notification.title}</p>
          {unread && <span className={["h-2 w-2 shrink-0 rounded-full", sev.dot].join(" ")} />}
        </div>
        {body && <p className="mt-0.5 text-[0.82rem] leading-[1.55] text-[#5c5e62]">{body}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <span className="text-[0.72rem] text-[#9ca3af]">{timeAgo(notification.created_at)}</span>
          {link && (
            <Link
              href={link}
              onClick={() => unread && onRead(notification.id)}
              className="text-[0.76rem] font-semibold text-[#E85C1A] transition hover:underline"
            >
              Open →
            </Link>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {unread && (
          <button
            type="button"
            onClick={() => onRead(notification.id)}
            title="Mark as read"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-black/[0.05] hover:text-[#1a1a1a]"
          >
            <CheckCheck size={15} strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDismiss(notification.id)}
          title="Dismiss"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-black/[0.05] hover:text-[#1a1a1a]"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </div>
    </li>
  );
}
