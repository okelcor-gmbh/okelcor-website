"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Mail, MessageCircle, CheckCheck, Loader2, ChevronLeft, ChevronRight, Forward } from "lucide-react";
import type { AdminCommunicationsInboxItem } from "@/lib/admin-api";
import { timeAgo } from "@/lib/admin-notifications";
import EmptyState from "@/components/ui/empty-state";
import ForwardToColleagueModal from "@/components/admin/forward-to-colleague-modal";

export default function CommunicationsInbox() {
  const [items, setItems] = useState<AdminCommunicationsInboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [forwarding, setForwarding] = useState<AdminCommunicationsInboxItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (unreadOnly) p.set("unread", "1");
    p.set("page", String(page));
    try {
      const res = await fetch(`/api/admin/communications/inbox?${p}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [] }));
      setItems(Array.isArray(json.data) ? json.data : []);
      const lp = json.meta?.last_page;
      setLastPage(typeof lp === "number" && lp > 0 ? lp : 1);
      setUnreadCount(typeof json.meta?.unread_count === "number" ? json.meta.unread_count : 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly, page]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [unreadOnly]);

  // Live replies can land with no admin action — keep the badge fresh while the page is open.
  useEffect(() => {
    const t = setInterval(() => { void load(); }, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const markRead = useCallback((id: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, unread: false } : i)));
    setUnreadCount((c) => Math.max(0, c - 1));
    fetch(`/api/admin/communications/${id}/read`, { method: "POST" }).catch(() => {});
  }, []);

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
              ? "bg-[#f4511e] text-white"
              : "border border-black/[0.09] bg-white text-[#5c5e62] hover:border-[#f4511e] hover:text-[#f4511e]",
          ].join(" ")}
        >
          Unread only
        </button>
        {unreadCount > 0 && (
          <span className="rounded-full bg-[#f0f2f5] px-2.5 py-1 text-[0.75rem] font-semibold text-[#5c5e62]">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-[#f4511e]" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            heading="No new replies"
            description={unreadOnly ? "No unread replies right now." : "Customer replies from e-mail and WhatsApp will appear here as they come in."}
          />
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {items.map((item) => (
              <InboxRow key={item.id} item={item} onRead={markRead} onForward={setForwarding} />
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
            className="flex h-9 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-[0.8rem] text-[#5c5e62]">Page {page} of {lastPage}</span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            className="flex h-9 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {forwarding && (
        <ForwardToColleagueModal
          communicationId={forwarding.id}
          subject={forwarding.subject}
          customerName={forwarding.customer_name}
          onClose={() => setForwarding(null)}
        />
      )}
    </>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function InboxRow({
  item, onRead, onForward,
}: {
  item: AdminCommunicationsInboxItem;
  onRead: (id: number) => void;
  onForward: (item: AdminCommunicationsInboxItem) => void;
}) {
  const ChannelIcon = item.channel === "whatsapp" ? MessageCircle : Mail;
  const channelCls = item.channel === "whatsapp" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-blue-50 text-blue-600 border-blue-200";

  return (
    <li className={["flex items-start gap-3 px-4 py-4 transition hover:bg-[#fafafa]", item.unread ? "bg-[#f4511e]/[0.03]" : ""].join(" ")}>
      <span className={["mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", channelCls].join(" ")}>
        <ChannelIcon size={15} strokeWidth={1.9} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
            {item.customer_name ?? "New inquiry"}
          </p>
          {item.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[#f4511e]" />}
          {!item.customer_id && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.63rem] font-bold text-amber-700">New lead</span>
          )}
        </div>
        {item.subject && <p className="mt-0.5 text-[0.8rem] font-medium text-[#1a1a1a]">{item.subject}</p>}
        {item.preview && <p className="mt-0.5 line-clamp-1 text-[0.82rem] text-[#5c5e62]">{item.preview}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <span className="text-[0.72rem] text-[#9ca3af]">{timeAgo(item.created_at)}</span>
          <Link
            href={item.action_url}
            onClick={() => item.unread && onRead(item.id)}
            className="text-[0.76rem] font-semibold text-[#f4511e] transition hover:underline"
          >
            Open →
          </Link>
          {/* WhatsApp rows have no e-mail to forward — the endpoint takes a
              communication of any channel, but quoting a WhatsApp thread into
              an e-mail is a different feature. */}
          {item.channel !== "whatsapp" && (
            <button
              type="button"
              onClick={() => onForward(item)}
              className="flex items-center gap-1 text-[0.76rem] font-semibold text-[#5c5e62] transition hover:text-[#f4511e]"
            >
              <Forward size={12} /> Forward to a colleague
            </button>
          )}
        </div>
      </div>

      {item.unread && (
        <button
          type="button"
          onClick={() => onRead(item.id)}
          title="Mark as read"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-black/[0.05] hover:text-[#1a1a1a]"
        >
          <CheckCheck size={15} strokeWidth={2} />
        </button>
      )}
    </li>
  );
}
