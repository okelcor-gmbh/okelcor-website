"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Paperclip, Download, Loader2, Send, ChevronDown, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import type { CustomerCommunication } from "@/lib/customer-communications";
import { timeAgo } from "@/lib/customer-notifications";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "csv"];

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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    if (attachments.length + incoming.length > MAX_ATTACHMENTS) {
      setError(`Maximum ${MAX_ATTACHMENTS} attachments.`);
      return;
    }
    for (const file of incoming) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`File type ".${ext}" not allowed. Use: ${ALLOWED_EXTENSIONS.join(", ")}.`);
        return;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(`"${file.name}" exceeds 10 MB.`);
        return;
      }
    }
    setError(null);
    setAttachments((prev) => [...prev, ...incoming]);
  }
  function removeAttachment(idx: number) { setAttachments((prev) => prev.filter((_, i) => i !== idx)); }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSending(true);
    setError(null);
    const fd = new FormData();
    fd.append("body", replyBody.trim());
    attachments.forEach((file) => fd.append("attachments[]", file));
    try {
      const res = await fetch(`/api/account/communications/${msg.id}/reply`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? "Could not send your reply.");
      onReplied((json.data ?? json) as CustomerCommunication);
      setReplyBody("");
      setAttachments([]);
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

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-black/[0.15] bg-white px-2.5 py-1.5 text-[0.75rem] text-[var(--muted)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)]">
                <Paperclip size={12} /> Attach files
                <input type="file" multiple accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
                  className="sr-only" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
              </label>
              <span className="text-[0.68rem] text-[#9ca3af]">Max {MAX_ATTACHMENTS}, 10MB each</span>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.07] bg-white px-3 py-1.5">
                    <span className="min-w-0 flex-1 truncate text-[0.76rem] text-[var(--foreground)]">{file.name}</span>
                    <span className="shrink-0 text-[0.68rem] text-[#9ca3af]">{(file.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="shrink-0 text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}

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
