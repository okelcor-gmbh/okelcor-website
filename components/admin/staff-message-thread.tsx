"use client";

/**
 * One internal thread, oldest first, with an inline reply box.
 *
 * Reply recipients are NOT chosen here. The API resolves them from the parent
 * message and ignores anything sent — a reply cannot pull someone new into a
 * thread and hand them its history. "Reply all" is therefore a checkbox over
 * who was already on it, not a recipient editor.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2, AlertCircle, ArrowLeft, Paperclip, Send, Forward, Trash2,
  CornerUpLeft, MailWarning, Users,
} from "lucide-react";
import type { StaffMessage } from "@/lib/staff-messages";
import {
  ALLOWED_EXTENSIONS, MAX_ATTACHMENTS, attachmentUrl, validateFiles,
} from "@/lib/staff-messages";

export default function StaffMessageThread({ messageId }: { messageId: number }) {
  const [thread, setThread] = useState<StaffMessage[]>([]);
  const [root, setRoot] = useState<StaffMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/staff-messages/${messageId}`, { cache: "no-store" });

      if (res.status === 404) {
        setLoadError("This message doesn't exist, or you're not on it.");
        return;
      }
      if (!res.ok) {
        setLoadError(
          res.status >= 500
            ? "Internal messaging isn't live yet — the backend needs migration #44."
            : `Could not load this message (error ${res.status}).`
        );
        return;
      }

      const json = await res.json().catch(() => ({}));
      setLoadError(null);
      setRoot(json.data?.message ?? null);
      setThread(Array.isArray(json.data?.thread) ? json.data.thread : []);
    } catch {
      setLoadError("Network error loading this message.");
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  useEffect(() => { void load(); }, [load]);

  // Clear the unread dot as soon as it is actually on screen.
  useEffect(() => {
    if (!root?.unread) return;
    fetch(`/api/admin/staff-messages/${messageId}/read`, { method: "POST" }).catch(() => {});
  }, [root?.unread, messageId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={22} className="animate-spin text-[#f4511e]" />
      </div>
    );
  }

  if (loadError || !root) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
        <MailWarning size={30} className="mx-auto text-[#9ca3af]" />
        <p className="mt-3 text-[0.9rem] font-semibold text-[#1a1a1a]">
          {loadError ?? "Message not found."}
        </p>
        <Link
          href="/admin/messages"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-black/[0.1] px-5 text-[0.82rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
        >
          <ArrowLeft size={14} /> Back to messages
        </Link>
      </div>
    );
  }

  const messages = thread.length > 0 ? thread : [root];
  const latest = messages[messages.length - 1];

  return (
    <>
      <Link
        href="/admin/messages"
        className="mb-4 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:text-[#f4511e]"
      >
        <ArrowLeft size={14} /> All messages
      </Link>

      <div className="mb-5 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-[1.15rem] font-extrabold text-[#1a1a1a]">{root.subject}</h1>
        {root.is_forward && root.forwarded_from?.action_url && (
          <Link
            href={root.forwarded_from.action_url}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[0.72rem] font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            <Forward size={11} /> Forwarded from a customer thread — open it
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {messages.map((m) => (
          <MessageCard key={m.id} message={m} />
        ))}
      </div>

      <ReplyBox parentId={latest.id} onSent={() => void load()} />
    </>
  );
}

function MessageCard({ message }: { message: StaffMessage }) {
  const failed = message.recipients.filter((r) => r.email_status === "failed");

  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-black/[0.06] pb-3">
        <span className="text-[0.875rem] font-bold text-[#1a1a1a]">{message.sender.name}</span>
        {message.sent_by_me && (
          <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-[0.63rem] font-bold text-[#5c5e62]">You</span>
        )}
        <span className="text-[0.75rem] text-[#9ca3af]">{formatWhen(message.created_at)}</span>
      </header>

      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.75rem] text-[#5c5e62]">
        <Users size={12} className="text-[#9ca3af]" />
        {message.recipients.map((r) => (
          <span key={`${r.id}-${r.kind}`} className="rounded-full bg-[#f7f8fa] px-2 py-0.5">
            {r.kind === "cc" ? "cc " : ""}{r.name}
            {r.read_at ? <span className="text-[#9ca3af]"> · read</span> : null}
          </span>
        ))}
      </p>

      {/* Sanitized server-side by RichEmailHtmlSanitizer before storage. */}
      <div
        className="mt-4 text-[0.875rem] leading-relaxed text-[#1a1a1a] [&_a]:text-[#f4511e] [&_a]:underline [&_img]:max-w-full [&_p]:my-2"
        dangerouslySetInnerHTML={{ __html: message.body }}
      />

      {message.attachments.length > 0 && (
        <div className="mt-5 space-y-1.5 border-t border-black/[0.06] pt-4">
          {message.attachments.map((a, i) => (
            <a
              key={i}
              href={attachmentUrl(message.id, i)}
              className="flex items-center gap-2 rounded-lg border border-black/[0.07] bg-[#fafafa] px-3 py-2 text-[0.8rem] text-[#1a1a1a] transition hover:border-[#f4511e]/40"
            >
              <Paperclip size={13} className="shrink-0 text-[#9ca3af]" />
              <span className="min-w-0 flex-1 truncate">{a.name ?? "Attachment"}</span>
              {a.size != null && (
                <span className="shrink-0 text-[0.7rem] text-[#9ca3af]">{(a.size / 1024).toFixed(0)} KB</span>
              )}
            </a>
          ))}
        </div>
      )}

      {failed.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <AlertCircle size={14} className="mt-[2px] shrink-0 text-amber-600" />
          <p className="text-[0.78rem] text-amber-800">
            The e-mail copy didn&apos;t reach {failed.map((f) => f.name).join(", ")}. They can still
            see it here in the panel.
          </p>
        </div>
      )}
    </article>
  );
}

function ReplyBox({ parentId, onSent }: { parentId: number; onSent: () => void }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [replyAll, setReplyAll] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const problem = validateFiles(attachments, incoming);
    if (problem) { setError(problem); return; }
    setError(null);
    setAttachments((p) => [...p, ...incoming]);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();

    const bodyHtml = bodyRef.current?.innerHTML ?? "";
    if (!bodyRef.current?.innerText.trim()) { setError("Write something before replying."); return; }

    setError(null);
    setSubmitting(true);

    const fd = new FormData();
    fd.append("body", bodyHtml);
    if (replyAll) fd.append("reply_all", "1");
    attachments.forEach((f) => fd.append("attachments[]", f));

    try {
      const res = await fetch(`/api/admin/staff-messages/${parentId}/reply`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({})) as { message?: string; code?: string };

      if (res.status === 422 && json.code === "no_recipients") {
        setError("There's nobody left to reply to on this thread.");
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setError(json.message ?? `Could not send the reply (error ${res.status}).`);
        setSubmitting(false);
        return;
      }

      if (bodyRef.current) bodyRef.current.innerHTML = "";
      setAttachments([]);
      setSubmitting(false);
      onSent();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 rounded-2xl bg-white p-6 shadow-sm">
      <p className="mb-3 flex items-center gap-2 text-[0.8rem] font-bold text-[#1a1a1a]">
        <CornerUpLeft size={14} className="text-[#f4511e]" /> Reply
      </p>

      <div
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[110px] rounded-xl border border-black/[0.1] bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition focus:border-[#f4511e] focus:bg-white focus:ring-2 focus:ring-[#f4511e]/10 [&_p]:my-1"
      />

      {attachments.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {attachments.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.07] bg-[#fafafa] px-3 py-1.5">
              <span className="min-w-0 flex-1 truncate text-[0.78rem] text-[#1a1a1a]">{file.name}</span>
              <button
                type="button"
                onClick={() => setAttachments((p) => p.filter((_, i) => i !== idx))}
                className="shrink-0 text-red-400 transition hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
          <AlertCircle size={14} className="mt-[2px] shrink-0 text-red-500" />
          <p className="text-[0.8rem] text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] text-[#5c5e62]">
          <input
            type="checkbox" checked={replyAll}
            onChange={(e) => setReplyAll(e.target.checked)}
            className="h-4 w-4 accent-[#f4511e]"
          />
          Reply to everyone on this message
        </label>

        <label className="flex cursor-pointer items-center gap-1.5 text-[0.8rem] text-[#5c5e62] transition hover:text-[#f4511e]">
          <Paperclip size={14} /> Attach
          <input
            type="file" multiple
            accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
            className="sr-only"
            onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
        <span className="text-[0.72rem] text-[#9ca3af]">max {MAX_ATTACHMENTS}, 10MB each</span>

        <button
          type="submit" disabled={submitting}
          className="ml-auto flex h-10 items-center gap-2 rounded-xl bg-[#f4511e] px-6 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50"
        >
          {submitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={14} /> Reply</>}
        </button>
      </div>
    </form>
  );
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
}
