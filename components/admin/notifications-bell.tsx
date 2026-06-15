"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import type { AdminNotification } from "@/lib/admin-api";

const POLL_MS = 30_000;

function timeAgo(iso: string): string {
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

// ── Bell + dropdown panel ─────────────────────────────────────────────────────
// Polls /api/admin/notifications every 30s for the unread count. Backend
// is expected to create a notification (e.g. type "lead_assigned") whenever
// a quote/lead is assigned to an admin user — see PROGRESS.md for the contract.

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [], unread_count: 0 }));
      setItems(Array.isArray(json.data) ? json.data : []);
      setUnreadCount(typeof json.unread_count === "number" ? json.unread_count : 0);
    } catch {
      // Network error — silently skip
    }
  }, []);

  useEffect(() => {
    void poll();
    const t = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

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

  const handleToggle = () => {
    setOpen((v) => {
      if (!v) void poll();
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
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-[0.8rem] text-[#9ca3af]">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={markRead}
                  onNavigate={() => setOpen(false)}
                />
              ))
            )}
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
  onNavigate,
}: {
  notification: AdminNotification;
  onRead: (id: number) => void;
  onNavigate: () => void;
}) {
  const unread = !notification.read_at;

  const handleClick = () => {
    if (unread) onRead(notification.id);
    onNavigate();
  };

  const body = (
    <div
      className={[
        "flex items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f0f2f5]",
        unread ? "bg-[#E85C1A]/[0.04]" : "",
      ].join(" ")}
    >
      <span
        className={[
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          unread ? "bg-[#E85C1A]" : "bg-transparent",
        ].join(" ")}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.82rem] font-semibold text-[#1a1a1a]">{notification.title}</p>
        {notification.message && (
          <p className="mt-0.5 line-clamp-2 text-[0.76rem] leading-[1.5] text-[#5c5e62]">
            {notification.message}
          </p>
        )}
        <p className="mt-1 text-[0.7rem] text-[#9ca3af]">{timeAgo(notification.created_at)}</p>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleClick} className="block">
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className="block w-full">
      {body}
    </button>
  );
}
