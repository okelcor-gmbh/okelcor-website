"use client";

import { useState, useEffect } from "react";
import { X, Send, Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import type { EmailTemplate } from "@/lib/admin-api";

type Props = {
  quoteId: number;
  recipientName: string;
  recipientEmail: string;
  onClose: () => void;
  onSent?: () => void;
};

export default function FollowUpEmailModal({ quoteId, recipientName, recipientEmail, onClose, onSent }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/crm/email-templates", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const data = Array.isArray(json.data) ? json.data : [];
        setTemplates(data);
        if (data.length > 0) setSelectedTemplate(data[0].key);
      })
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, []);

  const selectedTpl = templates.find((t) => t.key === selectedTemplate);
  const templateIncomplete = !!selectedTpl && !selectedTpl.subject;
  const canSend = !!selectedTemplate && !templatesLoading && templates.length > 0 && !templateIncomplete;

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/send-follow-up-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: selectedTemplate, message: message.trim() || undefined }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const code = json.code as string | undefined;
        const backendMsg = (json.message ?? json.error) as string | undefined;
        let msg: string;
        if (code === "invalid_email_template") {
          msg = "Please select a valid email template.";
        } else if (code === "email_send_failed") {
          msg = backendMsg ?? "Email could not be sent. The communication was logged.";
        } else if (res.status >= 500) {
          msg = "A server error occurred. Please try again, or contact support if this persists.";
        } else {
          msg = backendMsg ?? `Request failed (${res.status}).`;
        }
        throw new Error(msg);
      }
      setResult({ type: "ok", text: (json.message as string) ?? "Email sent successfully." });
      onSent?.();
    } catch (err) {
      setResult({ type: "err", text: err instanceof Error ? err.message : "Failed to send email." });
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Send Follow-up Email</p>
            <div className="mt-1 flex items-center gap-2 text-[0.83rem] text-[#5c5e62]">
              <Mail size={13} className="shrink-0" />
              <span>{recipientName} &lt;{recipientEmail}&gt;</span>
            </div>
          </div>
          {!sending && (
            <button type="button" onClick={onClose} className="shrink-0 text-[#9ca3af] hover:text-[#1a1a1a]">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Template select */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#5c5e62]">
            Template
          </label>
          {templatesLoading ? (
            <div className="flex items-center gap-2 text-[0.83rem] text-[#9ca3af]">
              <Loader2 size={14} className="animate-spin" /> Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.83rem] text-amber-700">
              <AlertCircle size={14} className="shrink-0" /> No email templates available.
            </div>
          ) : (
            <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10">
              {templates.map((t) => (
                <option key={t.key} value={t.key}>{t.label || t.key}</option>
              ))}
            </select>
          )}
          {selectedTpl?.subject && (
            <p className="mt-1.5 text-[0.73rem] text-[#9ca3af]">
              Subject: <span className="text-[#5c5e62]">{selectedTpl.subject}</span>
            </p>
          )}
          {templateIncomplete && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[0.73rem] text-amber-600">
              <AlertCircle size={11} className="shrink-0" /> Selected template is incomplete — subject is missing.
            </p>
          )}
        </div>

        {/* Optional message */}
        <div className="mb-5">
          <label className="mb-1.5 block text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-[#5c5e62]">
            Additional note <span className="font-normal text-[#9ca3af]">(optional)</span>
          </label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
            placeholder="Add a personal note to this email…"
            className="w-full resize-none rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-[0.875rem] text-[#1a1a1a] outline-none transition placeholder:text-[#aaa] focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
        </div>

        {/* Result */}
        {result && (
          <div className={`mb-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[0.83rem] ${result.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
            {result.type === "ok" ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
            {result.text}
          </div>
        )}

        {/* Actions */}
        {result?.type === "ok" ? (
          <button type="button" onClick={onClose}
            className="w-full h-11 rounded-full border border-black/[0.1] text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]">
            Close
          </button>
        ) : (
          <div className="flex gap-3">
            <button type="button" disabled={sending} onClick={onClose}
              className="flex-1 h-11 rounded-full border border-black/[0.1] text-[0.875rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5] disabled:opacity-50">
              Cancel
            </button>
            <button type="button" disabled={sending || !canSend}
              onClick={handleSend}
              className="flex flex-1 h-11 items-center justify-center gap-2 rounded-full bg-[#1a1a1a] text-[0.875rem] font-semibold text-white transition hover:bg-[#333] disabled:opacity-50">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? "Sending…" : "Send Email"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
