"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle, Send, MessageCircle } from "lucide-react";
import type { Communication } from "@/lib/admin-api";

type Props = {
  context: "customer" | "quote";
  entityId: number;
  recipientPhone: string;
  recipientName?: string | null;
  onClose: () => void;
  onSent: (entry: Communication) => void;
};

export default function WhatsAppComposerModal({ context, entityId, recipientPhone, recipientName, onClose, onSent }: Props) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowClosed, setWindowClosed] = useState(false);

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!body.trim()) { setError("Write a message before sending."); return; }
    setSubmitting(true);
    setError(null);
    setWindowClosed(false);

    const apiPath = context === "customer"
      ? `/api/admin/customers/${entityId}/communications/send-whatsapp`
      : `/api/admin/quotes/${entityId}/communications/send-whatsapp`;

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });

      if (res.status === 404 || res.status === 405) {
        setError("Sending WhatsApp messages isn't available yet — the backend endpoint is pending deployment.");
        setSubmitting(false);
        return;
      }

      const json = await res.json().catch(() => ({})) as {
        data?: Communication; message?: string; code?: string;
      };

      if (res.status === 422 && json.code === "missing_recipient_phone") {
        setError("This customer has no phone number on file — can't send.");
        setSubmitting(false);
        return;
      }

      if (res.status === 502 && json.code === "whatsapp_send_failed") {
        if (json.data) onSent(json.data);
        setWindowClosed(true);
        setError(json.message ?? "This customer hasn't messaged in the last 24 hours, so WhatsApp won't allow a free-form reply yet.");
        setSubmitting(false);
        return;
      }

      if (!res.ok || !json.data) {
        setError(json.message ?? `Could not send (error ${res.status}).`);
        setSubmitting(false);
        return;
      }

      onSent(json.data);
      onClose();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]">
          <X size={16} />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 border-b border-black/[0.06] px-7 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]">
              <MessageCircle size={17} className="text-white" />
            </div>
            <div>
              <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Send WhatsApp Message</p>
              <p className="mt-0.5 text-[0.8rem] text-[#5c5e62]">
                To {recipientName ? `${recipientName} — ` : ""}<span className="font-mono">{recipientPhone}</span>
              </p>
            </div>
          </div>

          <div className="px-7 py-6">
            <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#1a1a1a]">Message *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Hi! Just checking in on your tyre order — any questions?"
              className={`w-full resize-none rounded-xl border bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#25D366]/10 ${error ? "border-red-400" : "border-black/[0.1] focus:border-[#25D366]"}`}
            />
            <p className="mt-1.5 text-[0.7rem] text-[#9ca3af]">
              Free-form text only works within 24 hours of the customer&apos;s last WhatsApp message — no attachments yet.
            </p>

            {error && (
              <div className={`mt-3 flex items-center gap-2 rounded-xl border px-4 py-2.5 ${windowClosed ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
                <AlertCircle size={14} className={`shrink-0 ${windowClosed ? "text-amber-600" : "text-red-500"}`} />
                <p className={`text-[0.8rem] ${windowClosed ? "text-amber-800" : "text-red-700"}`}>{error}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-black/[0.06] px-7 py-4">
            <button type="button" onClick={onClose}
              className="h-10 rounded-xl border border-black/[0.1] px-5 text-[0.82rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]">
              {windowClosed ? "Close" : "Cancel"}
            </button>
            {!windowClosed && (
              <button type="submit" disabled={submitting}
                className="flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-6 text-[0.82rem] font-semibold text-white transition hover:bg-[#1ebe5a] disabled:opacity-50">
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={14} /> Send</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
