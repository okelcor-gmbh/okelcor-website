"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Paperclip, Download, Loader2, Send, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import type { CustomerCommunication } from "@/lib/customer-communications";
import { timeAgo } from "@/lib/customer-notifications";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function MessagesCenter() {
  const [items, setItems] = useState<CustomerCommunication[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/communications", { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [] }));
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (msg: CustomerCommunication) => {
    const willOpen = openId !== msg.id;
    setOpenId(willOpen ? msg.id : null);
    if (willOpen && msg.direction === "outbound" && !msg.customer_read_at) {
      setItems((prev) => prev.map((m) => (m.id === msg.id ? { ...m, customer_read_at: new Date().toISOString() } : m)));
      fetch(`/api/account/communications/${msg.id}/read`, { method: "POST" }).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center rounded-[18px] bg-[#efefef] py-16 sm:rounded-[22px]">
        <Loader2 size={22} className="animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-[18px] bg-[#efefef] px-6 py-14 text-center sm:rounded-[22px] sm:px-8 sm:py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e0e0e0] sm:h-16 sm:w-16">
          <Mail size={26} strokeWidth={1.5} className="text-[var(--muted)]" />
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-[var(--foreground)] sm:text-xl">No messages yet</h2>
        <p className="mt-2 max-w-[320px] text-[0.88rem] text-[var(--muted)] sm:text-[0.9rem]">
          When the Okelcor team e-mails you about an order or quote, it&apos;ll appear here too.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] bg-[#efefef] sm:rounded-[22px]">
      {items.map((msg) => (
        <MessageRow key={msg.id} msg={msg} open={openId === msg.id} onToggle={() => handleOpen(msg)} onReplied={(entry) => setItems((prev) => [entry, ...prev])} />
      ))}
    </div>
  );
}

function MessageRow({
  msg, open, onToggle, onReplied,
}: {
  msg: CustomerCommunication;
  open: boolean;
  onToggle: () => void;
  onReplied: (entry: CustomerCommunication) => void;
}) {
  const unread = msg.direction === "outbound" && !msg.customer_read_at;
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/communications/${msg.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? "Could not send your reply.");
      onReplied((json.data ?? json) as CustomerCommunication);
      setReplyBody("");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your reply.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-b border-black/[0.06] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-white/50 sm:px-6 ${unread ? "bg-white/40" : ""}`}
      >
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${unread ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-white text-[var(--muted)]"}`}>
          <Mail size={16} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`truncate text-[0.88rem] ${unread ? "font-bold text-[var(--foreground)]" : "font-semibold text-[var(--foreground)]"}`}>
              {msg.subject || "(no subject)"}
            </p>
            {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />}
          </div>
          {msg.body && !open && (
            <p className="mt-0.5 line-clamp-1 text-[0.8rem] text-[var(--muted)]">{stripHtml(msg.body)}</p>
          )}
          <p className="mt-1 text-[0.72rem] text-[#9ca3af]">
            {msg.direction === "outbound" ? "Okelcor Team" : "You"} · {timeAgo(msg.created_at)}
          </p>
        </div>
        <ChevronDown size={16} className={`mt-1 shrink-0 text-[#9ca3af] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-black/[0.05] bg-white/60 px-4 py-4 sm:px-6">
          {msg.body && (
            <div className="prose-comm text-[0.85rem] leading-relaxed text-[var(--foreground)]" dangerouslySetInnerHTML={{ __html: msg.body }} />
          )}
          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {msg.attachments.map((att, idx) => (
                <a key={idx} href={`/api/account/communications/${msg.id}/attachments/${idx}/download`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-2.5 py-1.5 text-[0.75rem] text-[var(--foreground)] transition hover:bg-[#f5f5f5]">
                  <Paperclip size={11} /> {att.name} <Download size={11} />
                </a>
              ))}
            </div>
          )}

          {/* Reply */}
          <form onSubmit={handleReply} className="mt-4 border-t border-black/[0.06] pt-4">
            <label className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-wide text-[#9ca3af]">Reply</label>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={3}
              placeholder="Write a reply…"
              className="w-full resize-none rounded-xl border border-black/[0.1] bg-white px-3.5 py-2.5 text-[0.85rem] text-[var(--foreground)] outline-none transition placeholder:text-[#aaa] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
            />
            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-[0.75rem] text-red-600">
                <AlertCircle size={12} className="shrink-0" /> {error}
              </div>
            )}
            {sent && (
              <div className="mt-2 flex items-center gap-1.5 text-[0.75rem] text-emerald-700">
                <CheckCircle2 size={12} className="shrink-0" /> Reply sent — the team&apos;s been notified.
              </div>
            )}
            <button type="submit" disabled={sending || !replyBody.trim()}
              className="mt-2.5 flex h-9 items-center gap-2 rounded-full bg-[var(--primary)] px-5 text-[0.8rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-50">
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              {sending ? "Sending…" : "Send Reply"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
