"use client";

/**
 * Authenticated invoice download.
 *
 * Invoice PDFs are served by an AUTHENTICATED backend route, not a static file —
 * a raw <a href> browser navigation to the backend would 401. So we always fetch
 * through our own proxy (which forwards the customer bearer), receive the PDF as a
 * blob, and open it in a new tab. Status codes are mapped distinctly per the
 * backend contract:
 *   200 serve · 403 not yours · 423 held (EU cert pending) · 404 gone · 500 error
 */

import { useState, useCallback } from "react";
import { Download, Loader2, AlertCircle } from "lucide-react";

type Variant = "icon" | "solid";

const MESSAGES: Record<number, string> = {
  403: "This invoice isn't available on your account.",
  423: "Invoice pending — awaiting your EU entry certificate.",
  404: "We couldn't find this invoice file. Please contact support.",
};
const GENERIC = "Couldn't open the invoice. Please try again.";

export default function InvoiceDownloadButton({
  invoiceId,
  label = "Download invoice",
  variant = "solid",
}: {
  invoiceId: number | string;
  label?: string;
  variant?: Variant;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    // Open the tab synchronously so the browser treats it as user-initiated
    // (avoids the popup blocker swallowing it after the await).
    const tab = typeof window !== "undefined" ? window.open("", "_blank") : null;

    try {
      const res = await fetch(`/api/account/invoices/${invoiceId}/download`, {
        cache: "no-store",
      });

      if (!res.ok) {
        if (tab) tab.close();
        setError(MESSAGES[res.status] ?? GENERIC);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (tab) {
        tab.location.href = url;
      } else {
        // Popup blocked — fall back to a same-tab triggered anchor.
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }

      // Revoke after the tab has had time to load the PDF.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      if (tab) tab.close();
      setError(GENERIC);
    } finally {
      setBusy(false);
    }
  }, [busy, invoiceId]);

  if (variant === "icon") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          aria-label={label}
          title={label}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] text-[var(--muted)] transition hover:border-[var(--primary)]/40 hover:text-[var(--primary)] disabled:opacity-50"
        >
          {busy ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : <Download size={13} strokeWidth={2} />}
        </button>
        {error && (
          <span className="flex items-center gap-1 text-right text-[0.68rem] leading-tight text-red-600">
            <AlertCircle size={10} className="shrink-0" /> {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleDownload}
        disabled={busy}
        className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
      >
        {busy ? <Loader2 size={15} strokeWidth={2} className="animate-spin" /> : <Download size={15} strokeWidth={2} />}
        {label}
      </button>
      {error && (
        <span className="flex items-center gap-1.5 text-[0.78rem] text-red-600">
          <AlertCircle size={12} className="shrink-0" /> {error}
        </span>
      )}
    </div>
  );
}
