"use client";

/**
 * Dashboard "Recent activity" widget — a compact preview of the customer's
 * latest portal notifications, shown on the account overview. Links through to
 * the full notifications inbox. Graceful: renders a friendly empty state until
 * the backend notifications endpoint is live.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Mail } from "lucide-react";
import type { CustomerNotification } from "@/lib/customer-notifications";
import {
  notifBody, notifLink, NotifIcon, severityStyle, isEmailed, timeAgo,
} from "@/lib/customer-notifications";

export default function ActivityPreview() {
  const [items, setItems] = useState<CustomerNotification[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account/notifications?per_page=4", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (active) setItems(Array.isArray(j.data) ? j.data : []); })
      .catch(() => { if (active) setItems([]); });
    return () => { active = false; };
  }, []);

  return (
    <div className="rounded-[20px] border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={15} strokeWidth={2} className="text-[var(--primary)]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">Recent Activity</p>
        </div>
        <Link
          href="/account/notifications"
          className="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-[var(--primary)] transition hover:gap-1.5"
        >
          View all <ArrowRight size={12} strokeWidth={2.2} />
        </Link>
      </div>

      {items === null ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-black/[0.05]" />
              <div className="flex-1">
                <div className="h-3 w-2/3 animate-pulse rounded bg-black/[0.05]" />
                <div className="mt-1.5 h-2.5 w-1/3 animate-pulse rounded bg-black/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f5]">
            <Mail size={18} className="text-[var(--muted)]" />
          </span>
          <p className="text-[0.85rem] font-semibold text-[var(--foreground)]">You&apos;re all caught up</p>
          <p className="max-w-xs text-[0.78rem] leading-snug text-[var(--muted)]">
            Order, payment and document updates will show up here — and in your email.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {items.map((n) => {
            const sev = severityStyle(n.severity);
            const body = notifBody(n);
            const link = notifLink(n);
            const RowInner = (
              <div className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[#fafafa]">
                <span className={["mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border", sev.chip].join(" ")}>
                  <NotifIcon type={n.type} size={15} strokeWidth={1.9} className={sev.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.85rem] font-semibold text-[var(--foreground)]">{n.title}</p>
                  {body && <p className="mt-0.5 line-clamp-1 text-[0.78rem] text-[var(--muted)]">{body}</p>}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[0.7rem] text-[#9ca3af]">{timeAgo(n.created_at)}</span>
                    {isEmailed(n) && (
                      <span className="inline-flex items-center gap-1 text-[0.66rem] font-semibold text-[#9ca3af]">
                        <Mail size={10} strokeWidth={2} /> Emailed
                      </span>
                    )}
                  </div>
                </div>
                {!n.read_at && <span className={["mt-1.5 h-2 w-2 shrink-0 rounded-full", sev.dot].join(" ")} />}
              </div>
            );
            return (
              <li key={n.id}>
                {link ? <Link href={link} className="block">{RowInner}</Link> : RowInner}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
