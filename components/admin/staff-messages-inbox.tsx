"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail, Loader2, ChevronLeft, ChevronRight, PenSquare, Paperclip, Forward, MessagesSquare,
} from "lucide-react";
import { timeAgo } from "@/lib/admin-notifications";
import EmptyState from "@/components/ui/empty-state";
import StaffMessageComposer from "@/components/admin/staff-message-composer";
import type { StaffMessageRow } from "@/lib/staff-messages";
import { describeRecipients } from "@/lib/staff-messages";

type Box = "inbox" | "sent";

export default function StaffMessagesInbox() {
  const [box, setBox] = useState<Box>("inbox");
  const [items, setItems] = useState<StaffMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notDeployed, setNotDeployed] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [composing, setComposing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ box, page: String(page) });
    if (box === "inbox" && unreadOnly) p.set("unread", "1");

    try {
      const res = await fetch(`/api/admin/staff-messages?${p}`, { cache: "no-store" });

      // The endpoints 500 until migration #44 runs. Say that plainly instead
      // of showing an empty inbox, which would read as "no messages".
      if (res.status === 404 || res.status === 405 || res.status >= 500) {
        setNotDeployed(true);
        setItems([]);
        return;
      }

      setNotDeployed(false);
      const json = await res.json().catch(() => ({ data: [] }));
      setItems(Array.isArray(json.data) ? json.data : []);
      const lp = json.meta?.last_page;
      setLastPage(typeof lp === "number" && lp > 0 ? lp : 1);
      setUnreadTotal(typeof json.meta?.unread_total === "number" ? json.meta.unread_total : 0);
    } catch {
      setItems([]);
      setNotDeployed(true);
    } finally {
      setLoading(false);
    }
  }, [box, page, unreadOnly]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [box, unreadOnly]);

  // A colleague can write while this page is open — keep it fresh.
  useEffect(() => {
    const t = setInterval(() => { void load(); }, 30_000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-black/[0.09] bg-white p-1">
          {(["inbox", "sent"] as Box[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBox(b)}
              className={[
                "h-8 rounded-lg px-4 text-[0.8rem] font-semibold capitalize transition",
                box === b ? "bg-[#171a20] text-white" : "text-[#5c5e62] hover:text-[#1a1a1a]",
              ].join(" ")}
            >
              {b}
            </button>
          ))}
        </div>

        {box === "inbox" && (
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
        )}

        {unreadTotal > 0 && (
          <span className="rounded-full bg-[#f0f2f5] px-2.5 py-1 text-[0.75rem] font-semibold text-[#5c5e62]">
            {unreadTotal} unread
          </span>
        )}

        <button
          type="button"
          onClick={() => setComposing(true)}
          className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-[#f4511e] px-5 text-[0.82rem] font-semibold text-white transition hover:bg-[#df4618]"
        >
          <PenSquare size={15} /> New message
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={22} className="animate-spin text-[#f4511e]" />
          </div>
        ) : notDeployed ? (
          <EmptyState
            icon={MessagesSquare}
            heading="Internal messaging isn't live yet"
            description="The backend for this is built but not deployed — it needs migration #44. Nothing you send would be stored until then."
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Mail}
            heading={box === "sent" ? "Nothing sent yet" : unreadOnly ? "Nothing unread" : "No messages"}
            description={
              box === "sent"
                ? "Messages you send to colleagues will appear here."
                : "Messages from colleagues, and customer e-mails they forward to you, will appear here."
            }
          />
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {items.map((item) => (
              <MessageRow key={item.id} item={item} box={box} />
            ))}
          </ul>
        )}
      </div>

      {!loading && lastPage > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button" disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex h-9 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-[0.8rem] text-[#5c5e62]">Page {page} of {lastPage}</span>
          <button
            type="button" disabled={page >= lastPage}
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            className="flex h-9 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}

      {composing && (
        <StaffMessageComposer
          onClose={() => setComposing(false)}
          onSent={() => { setComposing(false); setBox("sent"); void load(); }}
        />
      )}
    </>
  );
}

function MessageRow({ item, box }: { item: StaffMessageRow; box: Box }) {
  const who = box === "sent"
    ? `To ${describeRecipients(item.recipients)}`
    : item.sender.name;

  return (
    <li className={["transition hover:bg-[#fafafa]", item.unread ? "bg-[#f4511e]/[0.03]" : ""].join(" ")}>
      <Link href={`/admin/messages/${item.id}`} className="flex items-start gap-3 px-4 py-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-[#f0f2f5] text-[0.68rem] font-bold text-[#5c5e62]">
          {initials(box === "sent" ? (item.recipients[0]?.name ?? "?") : item.sender.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">{who}</p>
            {item.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[#f4511e]" />}
            {item.is_forward && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[0.63rem] font-bold text-blue-700">
                <Forward size={9} /> Forwarded
              </span>
            )}
            {item.has_attachments && <Paperclip size={12} className="text-[#9ca3af]" />}
          </div>
          <p className="mt-0.5 text-[0.8rem] font-medium text-[#1a1a1a]">{item.subject}</p>
          {item.preview && <p className="mt-0.5 line-clamp-1 text-[0.82rem] text-[#5c5e62]">{item.preview}</p>}
          <span className="mt-1.5 block text-[0.72rem] text-[#9ca3af]">{timeAgo(item.created_at)}</span>
        </div>
      </Link>
    </li>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("");
}
