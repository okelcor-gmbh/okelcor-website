"use client";

/**
 * Forward a customer e-mail to a colleague.
 *
 * The original is quoted into the message server-side and its attachments are
 * copied, so nothing here needs to carry the body — only who it goes to and
 * the covering note.
 */

import { useEffect, useRef, useState } from "react";
import { X, Loader2, AlertCircle, Forward, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import StaffRecipientPicker from "@/components/admin/staff-recipient-picker";
import type { StaffColleague, StaffMessage } from "@/lib/staff-messages";

type Props = {
  /** customer_communications id */
  communicationId: number;
  subject?: string | null;
  customerName?: string | null;
  onClose: () => void;
};

export default function ForwardToColleagueModal({
  communicationId, subject, customerName, onClose,
}: Props) {
  const noteRef = useRef<HTMLDivElement>(null);

  const [directory, setDirectory] = useState<StaffColleague[]>([]);
  const [dirLoading, setDirLoading] = useState(true);

  const [to, setTo] = useState<number[]>([]);
  const [cc, setCc] = useState<number[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<StaffMessage | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

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

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();

    if (to.length === 0) { setErrors({ to: "Choose at least one colleague." }); return; }

    setErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/communications/${communicationId}/forward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          cc,
          note: noteRef.current?.innerHTML ?? "",
        }),
      });

      if (res.status === 404 || res.status === 405) {
        setFormError("Forwarding isn't live yet — the backend endpoint is pending deployment.");
        setSubmitting(false);
        return;
      }

      const json = await res.json().catch(() => ({})) as {
        data?: StaffMessage;
        meta?: { email_failures?: number[] };
        message?: string;
        errors?: Record<string, unknown>;
      };

      if (res.status === 403) {
        setFormError("You don't have permission to forward customer correspondence.");
        setSubmitting(false);
        return;
      }

      if (res.status === 422) {
        if (json.errors) {
          const mapped: Record<string, string> = {};
          for (const [k, val] of Object.entries(json.errors)) {
            mapped[k] = Array.isArray(val) ? String(val[0]) : String(val);
          }
          setErrors(mapped);
        }
        setFormError(json.message ?? "Please check the form and try again.");
        setSubmitting(false);
        return;
      }

      if (!res.ok || !json.data) {
        setFormError(json.message ?? `Could not forward (error ${res.status}).`);
        setSubmitting(false);
        return;
      }

      const failures = json.meta?.email_failures ?? [];
      if (failures.length > 0) {
        setWarning(
          json.message ??
          `Forwarded in the panel, but the e-mail copy failed for ${failures.length} recipient(s).`
        );
      }
      setSent(json.data);
      setSubmitting(false);
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <button
          type="button" onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#f0f2f5] hover:text-[#1a1a1a]"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 border-b border-black/[0.06] px-7 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#171a20]">
            <Forward size={17} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Forward to a colleague</p>
            <p className="mt-0.5 truncate text-[0.8rem] text-[#5c5e62]">
              {subject || "Customer message"}
              {customerName ? ` — ${customerName}` : ""}
            </p>
          </div>
        </div>

        {sent ? (
          <div className="px-7 py-8">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 size={34} className={warning ? "text-amber-500" : "text-emerald-500"} />
              <p className="mt-3 text-[0.95rem] font-bold text-[#1a1a1a]">
                {warning ? "Forwarded, with one caveat" : "Forwarded"}
              </p>
              <p className="mt-1 text-[0.82rem] text-[#5c5e62]">
                {warning ?? "The original message and its attachments went with it."}
              </p>
              <div className="mt-5 flex gap-3">
                <Link
                  href={`/admin/messages/${sent.id}`}
                  className="flex h-10 items-center rounded-xl bg-[#f4511e] px-5 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44d10]"
                >
                  Open the thread
                </Link>
                <button
                  type="button" onClick={onClose}
                  className="h-10 rounded-xl border border-black/[0.1] px-5 text-[0.82rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
                  Covering note <span className="font-normal text-[#9ca3af]">(optional)</span>
                </label>
                <div
                  ref={noteRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[100px] rounded-xl border border-black/[0.1] bg-[#fafafa] px-3.5 py-2.5 text-[0.85rem] text-[#1a1a1a] outline-none transition focus:border-[#f4511e] focus:bg-white focus:ring-2 focus:ring-[#f4511e]/10 [&_p]:my-1"
                />
                <p className="mt-1.5 text-[0.72rem] text-[#9ca3af]">
                  Goes above the original, which is quoted in full with its attachments.
                </p>
              </div>

              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                  <AlertCircle size={14} className="mt-[2px] shrink-0 text-red-500" />
                  <p className="text-[0.8rem] text-red-700">{formError}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-black/[0.06] px-7 py-4">
              <button
                type="button" onClick={onClose}
                className="h-10 rounded-xl border border-black/[0.1] px-5 text-[0.82rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={submitting}
                className="flex h-10 items-center gap-2 rounded-xl bg-[#f4511e] px-6 text-[0.82rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50"
              >
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Forwarding…</> : <><Forward size={14} /> Forward</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
