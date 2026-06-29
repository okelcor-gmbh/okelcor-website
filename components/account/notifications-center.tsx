"use client";

/**
 * Customer notifications center — an inbox-style view of every notification the
 * customer has received in the portal. Each notification mirrors a transactional
 * email (same subject + summary), with an "Emailed" tag when it was also sent by
 * email. Includes filters, pagination, and per-channel email preferences.
 *
 * Fully graceful: until the backend endpoints are live the list renders empty
 * and preferences fall back to sensible defaults.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell, CheckCheck, X, Loader2, ChevronLeft, ChevronRight, Mail, Inbox, ArrowRight,
} from "lucide-react";
import type {
  CustomerNotification, CustomerNotificationType, CustomerNotificationPreferences,
} from "@/lib/customer-notifications";
import {
  notifBody, notifLink, NotifIcon, severityStyle, isEmailed, isLiveTracking, timeAgo, typeLabel,
} from "@/lib/customer-notifications";

// ── Filter options ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: CustomerNotificationType | ""; label: string }[] = [
  { value: "", label: "All updates" },
  { value: "order_placed", label: "Orders" },
  { value: "payment_milestone", label: "Payments" },
  { value: "order_shipped", label: "Shipments" },
  { value: "document_ready", label: "Documents" },
  { value: "quote_ready", label: "Quotes" },
  { value: "account_approved", label: "Account" },
  { value: "security_alert", label: "Security" },
];

const SELECT_CLS =
  "h-10 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15";

export default function NotificationsCenter() {
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [type, setType] = useState<CustomerNotificationType | "">("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (unreadOnly) p.set("unread", "1");
    if (type) p.set("type", type);
    p.set("page", String(page));
    try {
      const res = await fetch(`/api/account/notifications?${p}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [] }));
      setItems(Array.isArray(json.data) ? json.data : []);
      const lp = json.meta?.last_page;
      setLastPage(typeof lp === "number" && lp > 0 ? lp : 1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, type, page]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [unreadOnly, type]);

  const markRead = useCallback((id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n))
    );
    fetch(`/api/account/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    fetch("/api/account/notifications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    fetch(`/api/account/notifications/${id}/dismiss`, { method: "POST" }).catch(() => {});
  }, []);

  const hasUnread = items.some((n) => !n.read_at);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* ── Inbox ──────────────────────────────────────────────────────────── */}
      <div>
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setUnreadOnly((v) => !v)}
            className={[
              "h-10 rounded-xl px-4 text-[0.8rem] font-semibold transition",
              unreadOnly
                ? "bg-[var(--primary)] text-white"
                : "border border-black/[0.09] bg-white text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
            ].join(" ")}
          >
            Unread only
          </button>

          <select className={SELECT_CLS} value={type} onChange={(e) => setType(e.target.value as CustomerNotificationType | "")}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>{o.label}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={!hasUnread}
            onClick={markAllRead}
            className="ml-auto flex h-10 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-4 text-[0.8rem] font-semibold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CheckCheck size={14} strokeWidth={2} />
            Mark all read
          </button>
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={22} className="animate-spin text-[var(--primary)]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5f5f5]">
                <Inbox size={24} className="text-[var(--muted)]" />
              </span>
              <p className="text-[0.95rem] font-bold text-[var(--foreground)]">
                {unreadOnly || type ? "Nothing matches these filters" : "Your inbox is empty"}
              </p>
              <p className="max-w-sm text-[0.83rem] leading-relaxed text-[var(--muted)]">
                {unreadOnly || type
                  ? "Try clearing the filters to see all your updates."
                  : "When there's news about your orders, quotes, payments or documents, it lands here — the same updates we send to your email."}
              </p>
            </div>
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
              className="flex h-9 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] font-semibold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-[0.8rem] text-[var(--muted)]">Page {page} of {lastPage}</span>
            <button
              type="button"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              className="flex h-9 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] font-semibold text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Sidebar: preferences ───────────────────────────────────────────── */}
      <PreferencesPanel />
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onRead,
  onDismiss,
}: {
  notification: CustomerNotification;
  onRead: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  const unread = !notification.read_at;
  const body = notifBody(notification);
  const link = notifLink(notification);
  const sev = severityStyle(notification.severity);

  return (
    <li className={["flex items-start gap-3 px-4 py-4 transition hover:bg-[#fafafa] sm:px-5", unread ? sev.ring : ""].join(" ")}>
      <span className={["mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border", sev.chip].join(" ")}>
        <NotifIcon type={notification.type} size={16} strokeWidth={1.9} className={sev.icon} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[0.66rem] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
            {typeLabel(notification.type)}
          </span>
          {isLiveTracking(notification) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.64rem] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          )}
          {isEmailed(notification) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[0.64rem] font-semibold text-[var(--muted)]">
              <Mail size={9} strokeWidth={2.2} /> Emailed
            </span>
          )}
          {unread && <span className={["h-2 w-2 shrink-0 rounded-full", sev.dot].join(" ")} />}
        </div>
        <p className="mt-1 text-[0.9rem] font-semibold leading-snug text-[var(--foreground)]">{notification.title}</p>
        {body && <p className="mt-0.5 text-[0.83rem] leading-[1.55] text-[var(--muted)]">{body}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-[0.72rem] text-[#9ca3af]">{timeAgo(notification.created_at)}</span>
          {link && (
            <Link
              href={link}
              onClick={() => unread && onRead(notification.id)}
              className="inline-flex items-center gap-1 text-[0.76rem] font-semibold text-[var(--primary)] transition hover:gap-1.5"
            >
              View details <ArrowRight size={12} strokeWidth={2.2} />
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-black/[0.05] hover:text-[var(--foreground)]"
          >
            <CheckCheck size={15} strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDismiss(notification.id)}
          title="Dismiss"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-black/[0.05] hover:text-[var(--foreground)]"
        >
          <X size={15} strokeWidth={2} />
        </button>
      </div>
    </li>
  );
}

// ── Preferences panel ───────────────────────────────────────────────────────────

const PREF_GROUPS: { key: keyof CustomerNotificationPreferences; title: string; desc: string; locked?: boolean }[] = [
  { key: "email_orders",    title: "Orders & payments", desc: "Confirmations, payment milestones, shipping and delivery.", locked: true },
  { key: "email_documents", title: "Documents",         desc: "Invoices, packing lists and shipment paperwork." },
  { key: "email_quotes",    title: "Quotes & proposals", desc: "Quote updates and proposals ready to review." },
  { key: "email_account",   title: "Account & security", desc: "Approvals, access requests and security alerts." },
  { key: "email_marketing", title: "News & offers",     desc: "Product news, promotions and announcements." },
];

function PreferencesPanel() {
  const [prefs, setPrefs] = useState<CustomerNotificationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/account/notifications/preferences", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (active) setPrefs(j.data ?? j ?? {}); })
      .catch(() => { if (active) setPrefs({}); });
    return () => { active = false; };
  }, []);

  const toggle = (key: keyof CustomerNotificationPreferences) => {
    setPrefs((prev) => {
      const next = { ...(prev ?? {}), [key]: !(prev?.[key] ?? true) };
      void persist(next);
      return next;
    });
  };

  async function persist(next: CustomerNotificationPreferences) {
    setSaving(true); setSaved(false);
    try {
      await fetch("/api/account/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* graceful — UI keeps the optimistic state */
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="h-fit rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] lg:sticky lg:top-[110px]">
      <div className="mb-1 flex items-center gap-2">
        <Bell size={14} strokeWidth={1.9} className="text-[var(--primary)]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">Email preferences</p>
      </div>
      <p className="mb-4 text-[0.8rem] leading-relaxed text-[var(--muted)]">
        Choose what we email you. Everything still appears here in your portal inbox.
      </p>

      <div className="flex flex-col divide-y divide-black/[0.05]">
        {PREF_GROUPS.map((g) => {
          const on = prefs?.[g.key] ?? true;
          return (
            <div key={g.key} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-[0.84rem] font-semibold text-[var(--foreground)]">{g.title}</p>
                <p className="mt-0.5 text-[0.74rem] leading-snug text-[var(--muted)]">{g.desc}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Toggle ${g.title} emails`}
                disabled={g.locked || prefs === null}
                onClick={() => toggle(g.key)}
                className={[
                  "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition",
                  on ? "bg-[var(--primary)]" : "bg-black/15",
                  g.locked ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                <span className={["absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5"].join(" ")} />
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[0.72rem] text-[var(--muted)]">
        {saving ? (
          <><Loader2 size={11} className="animate-spin" /> Saving…</>
        ) : saved ? (
          <><CheckCheck size={11} className="text-emerald-600" /> Preferences saved</>
        ) : (
          "Order, payment and shipping emails can't be turned off."
        )}
      </p>
    </aside>
  );
}
