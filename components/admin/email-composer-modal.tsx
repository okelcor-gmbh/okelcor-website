"use client";

/**
 * Rich e-mail composer for CRM-6 communications.
 *
 * The body editor is a plain, uncontrolled `contenteditable` div — not a
 * controlled React input bound to state on every keystroke, which would
 * clobber the cursor mid-paste. Paste is handled natively by the browser;
 * the backend sanitizer is the only thing that decides what's safe.
 */

import { useRef, useState } from "react";
import { X, Loader2, AlertCircle, Paperclip, Send, Trash2 } from "lucide-react";
import type { Communication } from "@/lib/admin-api";

type Props = {
  context: "customer" | "quote";
  entityId: number;
  recipientEmail: string;
  recipientName?: string | null;
  replyTo?: { id: number; subject?: string | null } | null;
  onClose: () => void;
  onSent: (entry: Communication) => void;
};

type FieldErrors = Record<string, string>;

const MAX_CC = 5;
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "csv"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailComposerModal({
  context, entityId, recipientEmail, recipientName, replyTo, onClose, onSent,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [subject, setSubject] = useState(() => {
    if (!replyTo?.subject) return "";
    return /^re:/i.test(replyTo.subject) ? replyTo.subject : `Re: ${replyTo.subject}`;
  });
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sentFailed, setSentFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function addCc() {
    const email = ccInput.trim().replace(/,$/, "");
    setCcInput("");
    if (!email) return;
    if (!EMAIL_RE.test(email)) { setErrors((p) => ({ ...p, cc: `"${email}" isn't a valid e-mail address.` })); return; }
    if (cc.includes(email)) return;
    if (cc.length >= MAX_CC) { setErrors((p) => ({ ...p, cc: `Maximum ${MAX_CC} CC recipients.` })); return; }
    setErrors((p) => ({ ...p, cc: "" }));
    setCc((p) => [...p, email]);
  }
  function removeCc(email: string) { setCc((p) => p.filter((e) => e !== email)); }

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    if (attachments.length + incoming.length > MAX_ATTACHMENTS) {
      setErrors((p) => ({ ...p, attachments: `Maximum ${MAX_ATTACHMENTS} attachments.` }));
      return;
    }
    for (const file of incoming) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrors((p) => ({ ...p, attachments: `File type ".${ext}" not allowed. Use: ${ALLOWED_EXTENSIONS.join(", ")}.` }));
        return;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setErrors((p) => ({ ...p, attachments: `"${file.name}" exceeds 10 MB.` }));
        return;
      }
    }
    setErrors((p) => ({ ...p, attachments: "" }));
    setAttachments((p) => [...p, ...incoming]);
  }
  function removeAttachment(idx: number) { setAttachments((p) => p.filter((_, i) => i !== idx)); }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const bodyHtml = bodyRef.current?.innerHTML ?? "";
    const bodyText = bodyRef.current?.innerText.trim() ?? "";

    const v: FieldErrors = {};
    if (!subject.trim()) v.subject = "Subject is required.";
    if (!bodyText) v.body = "Write a message before sending.";
    if (Object.keys(v).length) { setErrors((p) => ({ ...p, ...v })); return; }

    setErrors({});
    setFormError(null);
    setSentFailed(false);
    setSubmitting(true);

    const fd = new FormData();
    fd.append("subject", subject.trim());
    fd.append("body", bodyHtml);
    cc.forEach((email) => fd.append("cc[]", email));
    if (replyTo) fd.append("in_reply_to_id", String(replyTo.id));
    attachments.forEach((file) => fd.append("attachments[]", file));

    const apiPath = context === "customer"
      ? `/api/admin/customers/${entityId}/communications/send-email`
      : `/api/admin/quotes/${entityId}/communications/send-email`;

    try {
      const res = await fetch(apiPath, { method: "POST", body: fd });

      if (res.status === 404 || res.status === 405) {
        setFormError("Sending e-mails isn't available yet — the backend endpoint is pending deployment.");
        setSubmitting(false);
        return;
      }

      const json = await res.json().catch(() => ({})) as {
        data?: Communication; message?: string; code?: string; errors?: Record<string, unknown>;
      };

      if (res.status === 422) {
        if (json.code === "missing_recipient_email") {
          setFormError("This customer has no e-mail address on file — can't send.");
        } else if (json.errors) {
          const mapped: FieldErrors = {};
          for (const [k, val] of Object.entries(json.errors)) {
            mapped[k] = Array.isArray(val) ? String(val[0]) : String(val);
          }
          setErrors((p) => ({ ...p, ...mapped }));
        } else {
          setFormError(json.message ?? "Please check the form and try again.");
        }
        setSubmitting(false);
        return;
      }

      if (res.status === 502 && json.code === "email_send_failed") {
        // The attempt was still logged (with attachments) — not data loss, just a delivery failure.
        if (json.data) onSent(json.data);
        setSentFailed(true);
        setFormError(json.message ?? "The e-mail failed to send, but the attempt was saved to the thread.");
        setSubmitting(false);
        return;
      }

      if (!res.ok || !json.data) {
        setFormError(json.message ?? `Could not send (error ${res.status}).`);
        setSubmitting(false);
        return;
      }

      onSent(json.data);
      onClose();
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-black/[0.1] bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition placeholder:text-[#aaa] focus:bg-white focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]">
          <X size={16} />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 border-b border-black/[0.06] px-7 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E85C1A]">
              <Send size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[1rem] font-extrabold text-[#1a1a1a]">{replyTo ? "Reply" : "Compose E-mail"}</p>
              <p className="mt-0.5 text-[0.8rem] text-[#5c5e62]">
                To {recipientName ? `${recipientName} — ` : ""}<span className="font-mono">{recipientEmail}</span>
              </p>
            </div>
          </div>

          <div className="max-h-[60vh] space-y-3.5 overflow-y-auto px-7 py-6">
            {/* CC */}
            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]">CC <span className="font-normal text-[#9ca3af]">(optional, max {MAX_CC})</span></label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-black/[0.1] bg-[#fafafa] px-2 py-2">
                {cc.map((email) => (
                  <span key={email} className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[0.75rem] font-medium text-[#1a1a1a] shadow-sm">
                    {email}
                    <button type="button" onClick={() => removeCc(email)} className="text-[#9ca3af] hover:text-red-500"><X size={11} /></button>
                  </span>
                ))}
                <input
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addCc(); } }}
                  onBlur={addCc}
                  disabled={cc.length >= MAX_CC}
                  placeholder={cc.length === 0 ? "email@company.com" : ""}
                  className="min-w-[140px] flex-1 bg-transparent px-1.5 py-1 text-[0.83rem] text-[#1a1a1a] outline-none disabled:opacity-50"
                />
              </div>
              {errors.cc && <p className="mt-1 text-[0.72rem] text-red-500">{errors.cc}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]">Subject *</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)}
                className={`${inputCls} ${errors.subject ? "border-red-400" : ""}`} placeholder="Subject" />
              {errors.subject && <p className="mt-1 text-[0.72rem] text-red-500">{errors.subject}</p>}
            </div>

            {/* Body */}
            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]">Message *</label>
              <div
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                className={`min-h-[160px] rounded-xl border bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#E85C1A]/10 [&_img]:max-w-full [&_p]:my-1 ${errors.body ? "border-red-400" : "border-black/[0.1] focus:border-[#E85C1A]"}`}
              />
              {errors.body && <p className="mt-1 text-[0.72rem] text-red-500">{errors.body}</p>}
            </div>

            {/* Attachments */}
            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]">
                Attachments <span className="font-normal text-[#9ca3af]">(optional, max {MAX_ATTACHMENTS}, 10MB each)</span>
              </label>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition ${dragOver ? "border-[#E85C1A] bg-orange-50/40" : "border-black/[0.15] bg-white hover:border-[#E85C1A]/40"}`}
              >
                <Paperclip size={16} className="text-[#9ca3af]" />
                <span className="text-[0.8rem] text-[#5c5e62]">Drag files here, or click to browse</span>
                <input type="file" multiple accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
                  className="sr-only" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }} />
              </label>
              {errors.attachments && <p className="mt-1 text-[0.72rem] text-red-500">{errors.attachments}</p>}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.07] bg-[#fafafa] px-3 py-1.5">
                      <span className="min-w-0 flex-1 truncate text-[0.78rem] text-[#1a1a1a]">{file.name}</span>
                      <span className="shrink-0 text-[0.7rem] text-[#9ca3af]">{(file.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => removeAttachment(idx)} className="shrink-0 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formError && (
              <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${sentFailed ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                <AlertCircle size={14} className={`shrink-0 ${sentFailed ? "text-amber-600" : "text-red-500"}`} />
                <p className={`text-[0.8rem] ${sentFailed ? "text-amber-800" : "text-red-700"}`}>{formError}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-black/[0.06] px-7 py-4">
            <button type="button" onClick={onClose}
              className="h-10 rounded-xl border border-black/[0.1] px-5 text-[0.82rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]">
              {sentFailed ? "Close" : "Cancel"}
            </button>
            {!sentFailed && (
              <button type="submit" disabled={submitting}
                className="flex h-10 items-center gap-2 rounded-xl bg-[#E85C1A] px-6 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50">
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
