"use client";

/**
 * Portal "Messages" bell — links to /account/messages with an unread badge.
 * No dropdown (unlike the notification bell): messages need a full reply
 * flow, so we send the customer straight to the page rather than a preview.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";

const POLL_MS = 30_000;

export default function MessagesBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/api/account/communications?per_page=1", { cache: "no-store" });
      const json = await res.json().catch(() => ({ meta: { unread_count: 0 } }));
      setUnreadCount(typeof json.meta?.unread_count === "number" ? json.meta.unread_count : 0);
    } catch {
      /* network error — keep last known count */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial poll + interval, same pattern as notification-bell.tsx
    void poll();
    const t = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  return (
    <Link href="/account/messages" aria-label="Messages" className="tesla-icon-btn relative">
      <Mail size={20} strokeWidth={1.9} />
      {unreadCount > 0 && (
        <span className="absolute right-0.5 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[var(--primary)] px-0.5 text-[9px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
