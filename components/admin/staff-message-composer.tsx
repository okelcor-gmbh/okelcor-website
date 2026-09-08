"use client";

/**
 * Compose an internal message to a colleague.
 *
 * Body editor is an uncontrolled `contenteditable`, same as the customer
 * e-mail composer — a controlled input bound to state on every keystroke
 * clobbers the cursor mid-paste. The API sanitizes; nothing here tries to.
 */

import { useEffect, useRef, useState } from "react";
import { X, Loader2, AlertCircle, Paperclip, Send, Trash2, Info } from "lucide-react";
import StaffRecipientPicker from "@/components/admin/staff-recipient-picker";
import type { StaffColleague, StaffMessage } from "@/lib/staff-messages";
import {
  ALLOWED_EXTENSIONS, MAX_ATTACHMENTS, validateFiles,
} from "@/lib/staff-messages";

type Props = {
  onClose: () => void;
  onSent: (message: StaffMessage) => void;
};

export default function StaffMessageComposer({ onClose, onSent }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  const [directory, setDirectory] = useState<StaffColleague[]>([]);
  const [dirLoading, setDirLoading] = useState(true);

  const [to, setTo] = useState<number[]>([]);
  const [cc, setCc] = useState<number[]>([]);
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/staff-messages/directory", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!cancelled) setDirectory(Array.isArray(json.data) ? json.data : []);
      } catch {
        if (!cancelled) setDirectory([]);
      } finally {
        if (!cancelled) setDirLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const problem = validateFiles(attachments, incoming);
    if (problem) { setErrors((p) => ({ ...p, attachments: problem })); return; }
    setErrors((p) => ({ ...p, attachments: "" }));
    setAttachments((p) => [...p, ...incoming]);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();

    const bodyHtml = bodyRef.current?.innerHTML ?? "";
    const bodyText = bodyRef.current?.innerText.trim() ?? "";

    const v: Record<string, string> = {};
    if (to.length === 0) v.to = "Choose at least one colleague.";
    if (!subject.trim()) v.subject = "Subject is required.";
    if (!bodyText) v.body = "Write a message before sending.";
    if (Object.keys(v).length) { setErrors((p) => ({ ...p, ...v })); return; }

    setErrors({});
    setFormError(null);
    setWarning(null);
    setSubmitting(true);

    const fd = new FormData();
    to.forEach((id) => fd.append("to[]", String(id)));
    cc.forEach((id) => fd.append("cc[]", String(id)));
    fd.append("subject", subject.trim());
    fd.append("body", bodyHtml);
    attachments.forEach((file) => fd.append("attachments[]", file));

    try {
      const res = await fetch("/api/admin/staff-messages", { method: "POST", body: fd });

      if (res.status === 404 || res.status === 405) {
        setFormError("Internal messaging isn't live yet — the backend endpoint is pending deployment.");
        setSubmitting(false);
        return;
      }

      const json = await res.json().catch(() => ({})) as {
        data?: StaffMessage;
        meta?: { email_failures?: number[] };
        message?: string;
        code?: string;
        errors?: Record<string, unknown>;
      };

      if (res.status === 422) {
        if (json.errors) {
          const mapped: Record<string, string> = {};
          for (const [k, val] of Object.entries(json.errors)) {
            mapped[k] = Array.isArray(val) ? String(val[0]) : String(val);
          }
          setErrors((p) => ({ ...p, ...mapped }));
        }
        setFormError(json.message ?? "Please check the form and try again.");
        setSubmitting(false);
        return;
      }

      if (!res.ok || !json.data) {
        setFormError(json.message ?? `Could not send (error ${res.status}).`);
        setSubmitting(false);
        return;
      }

      // 201 with failures: the colleague HAS the message in their panel inbox,
      // only the e-mail copy bounced. Say so rather than reporting a clean send
      // or a failure — neither would be true.
      const failures = json.meta?.email_failures ?? [];
      if (failures.length > 0) {
        onSent(json.data);
        setWarning(
          json.message ??
          `Delivered in the panel, but the e-mail copy failed for ${failures.length} recipient(s).`
        );
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

  const inputCls =
    "w-full rounded-xl border border-black/[0.1] bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition placeholder:text-[#aaa] focus:bg-white focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <button
          type="button" onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"
        >
          <X size={16} />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 border-b border-black/[0.06] px-7 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#171a20]">
              <Send size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Message a colleague</p>
              <p className="mt-0.5 text-[0.8rem] text-[#5c5e62]">
                Lands in their panel inbox and their Okelcor mailbox.
              </p>
            </div>
          </div>

          <div className="max-h-[60vh] space-y-3.5 overflow-y-auto px-7 py-6">
            <StaffRecipientPicker
              label="To" selected={to} onChange={setTo} exclude={cc}
              directory={directory} loading={dirLoading} error={errors.to}
            />
            <StaffRecipientPicker
              label="CC" optional selected={cc} onChange={setCc} exclude={to}
              directory={directory} loading={dirLoading} error={errors.cc}
            />

            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]">
                Subject <span className="text-[#f4511e]">*</span>
              </label>
              <input
                value={subject} onChange={(e) => setSubject(e.target.value)}
                className={`${inputCls} ${errors.subject ? "border-red-400" : ""}`}
                placeholder="What is this about?"
              />
              {errors.subject && <p className="mt-1 text-[0.72rem] text-red-500">{errors.subject}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]">
                Message <span className="text-[#f4511e]">*</span>
              </label>
              <div
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                className={`min-h-[160px] rounded-xl border bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#f4511e]/10 [&_img]:max-w-full [&_p]:my-1 ${errors.body ? "border-red-400" : "border-black/[0.1] focus:border-[#f4511e]"}`}
              />
              {errors.body && <p className="mt-1 text-[0.72rem] text-red-500">{errors.body}</p>}
              <p className="mt-1.5 flex items-start gap-1.5 text-[0.72rem] text-[#9ca3af]">
                <Info size={12} className="mt-[1px] shrink-0" />
                Your signature is added automatically — don&apos;t paste it in, or it appears twice.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]">
                Attachments{" "}
                <span className="font-normal text-[#9ca3af]">(optional, max {MAX_ATTACHMENTS}, 10MB each)</span>
              </label>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition ${dragOver ? "border-[#f4511e] bg-orange-50/40" : "border-black/[0.15] bg-white hover:border-[#f4511e]/40"}`}
              >
                <Paperclip size={16} className="text-[#9ca3af]" />
                <span className="text-[0.8rem] text-[#5c5e62]">Drag files here, or click to browse</span>
                <input
                  type="file" multiple
                  accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
                  className="sr-only"
                  onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
                />
              </label>
              {errors.attachments && <p className="mt-1 text-[0.72rem] text-red-500">{errors.attachments}</p>}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-black/[0.07] bg-[#fafafa] px-3 py-1.5">
                      <span className="min-w-0 flex-1 truncate text-[0.78rem] text-[#1a1a1a]">{file.name}</span>
                      <span className="shrink-0 text-[0.7rem] text-[#9ca3af]">{(file.size / 1024).toFixed(0)} KB</span>
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
            </div>

            {(formError || warning) && (
              <div className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 ${warning ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                <AlertCircle size={14} className={`mt-[2px] shrink-0 ${warning ? "text-amber-600" : "text-red-500"}`} />
                <p className={`text-[0.8rem] ${warning ? "text-amber-800" : "text-red-700"}`}>
                  {warning ?? formError}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-black/[0.06] px-7 py-4">
            <button
              type="button" onClick={onClose}
              className="h-10 rounded-xl border border-black/[0.1] px-5 text-[0.82rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
            >
              {warning ? "Close" : "Cancel"}
            </button>
            {!warning && (
              <button
                type="submit" disabled={submitting}
                className="flex h-10 items-center gap-2 rounded-xl bg-[#f4511e] px-6 text-[0.82rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-50"
              >
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
