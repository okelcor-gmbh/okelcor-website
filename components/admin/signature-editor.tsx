"use client";

/**
 * Uncontrolled contenteditable signature editor.
 *
 * Deliberately NOT a controlled React input bound to state on every keystroke —
 * that clobbers the cursor mid-paste. We load the signature into the div once
 * on mount and only read `el.innerHTML` when the admin clicks Save. Paste is
 * handled natively by the browser for fidelity; the backend sanitizer is the
 * only thing that decides what's safe, never this component.
 */

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, PenLine } from "lucide-react";
import { updateSignature } from "@/app/admin/profile/actions";

type Props = { initialHtml: string | null | undefined };

export default function SignatureEditor({ initialHtml }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const loadedOnce = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (loadedOnce.current || !ref.current) return;
    ref.current.innerHTML = initialHtml ?? "";
    loadedOnce.current = true;
    // Only ever load once — re-renders from unrelated state elsewhere on the
    // page must not stomp on whatever the admin is currently editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!ref.current) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const html = ref.current.innerHTML;
    const res = await updateSignature(html);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    // Render back exactly what the backend stored (sanitized), not the raw paste.
    if (ref.current && res.signatureHtml !== undefined) {
      ref.current.innerHTML = res.signatureHtml;
    }
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <PenLine size={14} className="text-[#5c5e62]" />
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#5c5e62]">My E-mail Signature</p>
      </div>
      <p className="mb-3 text-[0.78rem] text-[#5c5e62]">
        Appended automatically to every e-mail you send from the admin panel — nothing to do in the composer. Paste from
        Outlook, Gmail, or Word to keep formatting and images.
      </p>

      {success && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.83rem] text-emerald-700">
          <CheckCircle2 size={14} className="shrink-0" /> Signature saved.
        </div>
      )}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[120px] rounded-xl border border-black/[0.1] bg-[#fafafa] px-4 py-3 text-[0.875rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A] focus:bg-white focus:ring-2 focus:ring-[#E85C1A]/10 [&_img]:max-w-full [&_p]:my-1"
      />

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="mt-4 flex h-10 items-center gap-2 rounded-xl bg-[#E85C1A] px-6 text-[0.83rem] font-semibold text-white transition hover:bg-[#d44d10] disabled:opacity-50"
      >
        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Save Signature"}
      </button>
    </div>
  );
}
