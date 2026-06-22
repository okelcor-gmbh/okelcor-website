"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import type { AdminNotification } from "@/lib/admin-api";
import {
  notifBody, notifLink, NotifIcon, severityStyle, timeAgo,
} from "@/lib/admin-notifications";

const POLL_MS = 30_000;

// ── Bell + dropdown panel ─────────────────────────────────────────────────────
// CRM-3B. Polls the lightweight /unread-count endpoint every 30s for the badge,
// and fetches the latest 10 notifications when the panel is opened. The backend
// creates a notification (e.g. type "lead_assigned") whenever work is assigned
// to an admin user — see PROGRESS.md / docs for the contract.

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const pollCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/unread-count", { cache: "no-store" });
      const json = await res.json().catch(() => ({ unread_count: 0 }));
      setUnreadCount(typeof json.unread_count === "number" ? json.unread_count : 0);
    } catch {
      // Network error — silently skip
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications?per_page=10", { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [], unread_count: 0 }));
      setItems(Array.isArray(json.data) ? json.data : []);
      if (typeof json.unread_count === "number") setUnreadCount(json.unread_count);
    } catch {
      // Network error — silently skip
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
    fetch(`/api/admin/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    setUnreadCount(0);
    fetch("/api/admin/notifications/read-all", { method: "POST" }).catch(() => {});
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read_at) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
    fetch(`/api/admin/notifications/${id}/dismiss`, { method: "POST" }).catch(() => {});
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
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#1a1a1a] transition hover:bg-[#f0f2f5]"
      >
        <Bell size={18} strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E85C1A] px-1 text-[9px] font-extrabold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
            <p className="text-[0.83rem] font-bold text-[#1a1a1a]">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-[0.72rem] font-semibold text-[#E85C1A] transition hover:underline"
              >
                <CheckCheck size={12} strokeWidth={2} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-[0.8rem] text-[#9ca3af]">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-[0.8rem] text-[#9ca3af]">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => (
                <NotificationRow
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
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-center text-[0.78rem] font-semibold text-[#E85C1A] transition hover:bg-[#f0f2f5]"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onRead,
  onDismiss,
  onNavigate,
}: {
  notification: AdminNotification;
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
    <div
      className={[
        "flex items-start gap-2.5 px-4 py-3 text-left transition hover:bg-[#f0f2f5]",
        unread ? "bg-[#E85C1A]/[0.04]" : "",
      ].join(" ")}
    >
      <span className={["mt-0.5 shrink-0", sev.icon].join(" ")}>
        <NotifIcon type={notification.type} size={15} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.82rem] font-semibold text-[#1a1a1a]">{notification.title}</p>
        {body && (
          <p className="mt-0.5 line-clamp-2 text-[0.76rem] leading-[1.5] text-[#5c5e62]">{body}</p>
        )}
        <p className="mt-1 text-[0.7rem] text-[#9ca3af]">{timeAgo(notification.created_at)}</p>
      </div>
      {unread && <span className={["mt-1.5 h-2 w-2 shrink-0 rounded-full", sev.dot].join(" ")} />}
    </div>
  );

  return (
    <div className="group relative">
      {link ? (
        <Link href={link} onClick={handleClick} className="block">
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={handleClick} className="block w-full">
          {inner}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDismiss(notification.id);
        }}
        className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-md text-[#9ca3af] transition hover:bg-black/[0.06] hover:text-[#1a1a1a] group-hover:flex"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
