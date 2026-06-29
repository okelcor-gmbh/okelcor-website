"use client";

/**
 * Customer notification bell for the navbar (authenticated customers only).
 *
 * Polls the lightweight /unread-count endpoint every 30s for the badge and
 * fetches the latest notifications when the panel opens. Each row reads like an
 * email: subject + preview + an "Emailed" tag when the same notification was
 * also delivered by email. Fully graceful — renders an empty state until the
 * backend endpoints are live (see docs/BACKEND-CUSTOMER-NOTIFICATIONS.md).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Mail, X } from "lucide-react";
import type { CustomerNotification } from "@/lib/customer-notifications";
import {
  notifBody, notifLink, NotifIcon, severityStyle, isEmailed, isLiveTracking, timeAgo,
} from "@/lib/customer-notifications";

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[0.62rem] font-bold text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
    </span>
  );
}

const POLL_MS = 30_000;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const pollCount = useCallback(async () => {
    try {
      const res = await fetch("/api/account/notifications/unread-count", { cache: "no-store" });
      const json = await res.json().catch(() => ({ unread_count: 0 }));
      setUnreadCount(typeof json.unread_count === "number" ? json.unread_count : 0);
    } catch {
      /* network error — keep last known count */
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/notifications?per_page=8", { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [], unread_count: 0 }));
      setItems(Array.isArray(json.data) ? json.data : []);
      if (typeof json.unread_count === "number") setUnreadCount(json.unread_count);
    } catch {
      /* network error — keep last list */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void pollCount();
    const t = setInterval(() => void pollCount(), POLL_MS);
    return () => clearInterval(t);
  }, [pollCount]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = useCallback((id: number) => {
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    fetch(`/api/account/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    setUnreadCount(0);
    fetch("/api/account/notifications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read_at) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
    fetch(`/api/account/notifications/${id}/dismiss`, { method: "POST" }).catch(() => {});
  }, []);

  const handleToggle = () => {
    setOpen((v) => {
      if (!v) void loadList();
      return !v;
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={open}
        className={`tesla-icon-btn relative ${open ? "tesla-icon-btn-active" : ""}`}
      >
        <Bell size={20} strokeWidth={1.9} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--primary)] px-0.5 text-[9px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-black/[0.07] bg-white/95 shadow-[0_18px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
            <div>
              <p className="text-[0.85rem] font-bold text-[var(--foreground)]">Notifications</p>
              <p className="text-[0.7rem] text-[var(--muted)]">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-[0.72rem] font-semibold text-[var(--primary)] transition hover:underline"
              >
                <CheckCheck size={12} strokeWidth={2} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[0.8rem] text-[var(--muted)]">Loading…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f5]">
                  <Mail size={18} className="text-[var(--muted)]" />
                </span>
                <p className="text-[0.82rem] font-semibold text-[var(--foreground)]">No notifications yet</p>
                <p className="max-w-[230px] text-[0.74rem] leading-snug text-[var(--muted)]">
                  Updates about your orders, quotes and documents will appear here — the same ones we email you.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <BellRow
                  key={n.id}
                  notification={n}
                  onRead={markRead}
                  onDismiss={dismiss}
                  onNavigate={() => setOpen(false)}
                />
              ))
            )}
          </div>

          <div className="border-t border-black/[0.06]">
            <Link
              href="/account/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-[0.78rem] font-semibold text-[var(--primary)] transition hover:bg-[#fff5f3]"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Row ──────────────────────────────────────────────────────────────────────────

function BellRow({
  notification,
  onRead,
  onDismiss,
  onNavigate,
}: {
  notification: CustomerNotification;
  onRead: (id: number) => void;
  onDismiss: (id: number) => void;
  onNavigate: () => void;
}) {
  const unread = !notification.read_at;
  const body = notifBody(notification);
  const link = notifLink(notification);
  const sev = severityStyle(notification.severity);

  const handleClick = () => {
    if (unread) onRead(notification.id);
    onNavigate();
  };

  const inner = (
    <div className={["flex items-start gap-2.5 px-4 py-3 text-left transition hover:bg-[#fafafa]", unread ? sev.ring : ""].join(" ")}>
      <span className={["mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", sev.chip].join(" ")}>
        <NotifIcon type={notification.type} size={14} strokeWidth={1.9} className={sev.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.82rem] font-semibold text-[var(--foreground)]">{notification.title}</p>
        {body && <p className="mt-0.5 line-clamp-2 text-[0.76rem] leading-[1.5] text-[var(--muted)]">{body}</p>}
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[0.7rem] text-[#9ca3af]">{timeAgo(notification.created_at)}</span>
          {isLiveTracking(notification) && <LiveBadge />}
          {isEmailed(notification) && (
            <span className="inline-flex items-center gap-1 text-[0.66rem] font-semibold text-[#9ca3af]">
              <Mail size={10} strokeWidth={2} /> Emailed
            </span>
          )}
        </div>
      </div>
      {unread && <span className={["mt-1.5 h-2 w-2 shrink-0 rounded-full", sev.dot].join(" ")} />}
    </div>
  );

  return (
    <div className="group relative">
      {link ? (
        <Link href={link} onClick={handleClick} className="block">{inner}</Link>
      ) : (
        <button type="button" onClick={handleClick} className="block w-full">{inner}</button>
      )}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-md text-[#9ca3af] transition hover:bg-black/[0.06] hover:text-[var(--foreground)] group-hover:flex"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
