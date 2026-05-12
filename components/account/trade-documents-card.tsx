"use client";

import { useState } from "react";
import { Download, ExternalLink, FileText, Loader2, Lock } from "lucide-react";
import type { TradeDocument } from "@/lib/admin-api";

const TYPE_LABEL: Record<string, string> = {
  proforma_invoice:   "Proforma Invoice",
  commercial_invoice: "Commercial Invoice",
  packing_list:       "Packing List",
  other:              "Document",
};

// Document types that require EU certificate sign-off before download
const GATED_TYPES = new Set(["commercial_invoice", "final_invoice"]);

// These document types open inline in a new browser tab rather than being
// force-downloaded. The browser sends the httpOnly cookie automatically since
// the proxy route is same-origin.
const INLINE_TYPES = new Set(["commercial_invoice", "final_invoice", "packing_list"]);

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

export default function TradeDocumentsCard({
  documents,
  declarationRequired,
  declarationStatus,
}: {
  documents: TradeDocument[];
  declarationRequired?: boolean | null;
  declarationStatus?: "pending" | "signed" | "acknowledged" | null;
}) {
  const [downloading, setDownloading] = useState<number | null>(null);

  // Returns true when this document must be locked pending EU certificate signing.
  // Proforma invoices and packing lists are never locked.
  // Only locks when declaration is required AND certificate not yet signed.
  function isLocked(doc: TradeDocument): boolean {
    if (!declarationRequired) return false;
    if (!GATED_TYPES.has(doc.type)) return false;
    return declarationStatus !== "signed" && declarationStatus !== "acknowledged";
  }

  async function handleDownload(doc: TradeDocument) {
    setDownloading(doc.id);
    try {
      const res = await fetch(`/api/account/trade-documents/${doc.id}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = doc.original_filename
        ?? `${TYPE_LABEL[doc.type] ?? "document"}.pdf`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user can retry
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:mb-5 sm:text-[11px]">
        Documents
      </p>

      {documents.length === 0 ? (
        <p className="text-[0.83rem] text-[var(--muted)]">
          No documents have been issued yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => {
            const locked = isLocked(doc);
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-[12px] bg-white px-4 py-3"
              >
                <FileText
                  size={16}
                  strokeWidth={1.8}
                  className={`shrink-0 ${locked ? "text-[var(--muted)]" : "text-[var(--primary)]"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-[0.88rem] font-semibold ${locked ? "text-[var(--muted)]" : "text-[var(--foreground)]"}`}>
                    {TYPE_LABEL[doc.type] ?? doc.type}
                  </p>
                  {doc.number && (
                    <p className="font-mono text-[0.72rem] text-[var(--muted)]">
                      #{doc.number}
                    </p>
                  )}
                  <p className="text-[0.72rem] text-[var(--muted)]">
                    Issued {shortDate(doc.issued_at)}
                  </p>
                </div>

                {locked ? (
                  <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f5f5f5] px-3 text-[0.72rem] text-[var(--muted)]">
                    <Lock size={11} strokeWidth={2} />
                    Requires certificate
                  </div>
                ) : INLINE_TYPES.has(doc.type) ? (
                  // Final/commercial invoices open inline in a new tab.
                  // The browser forwards the session cookie automatically.
                  <a
                    href={`/api/account/trade-documents/${doc.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f0f0f0] px-3 text-[0.75rem] font-semibold text-[var(--foreground)] transition hover:bg-[var(--primary)] hover:text-white"
                  >
                    <ExternalLink size={12} strokeWidth={2.2} />
                    View PDF
                  </a>
                ) : (
                  // Proforma invoices and packing lists are force-downloaded so
                  // the customer gets a local file to attach to shipment paperwork.
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f0f0f0] px-3 text-[0.75rem] font-semibold text-[var(--foreground)] transition hover:bg-[var(--primary)] hover:text-white disabled:opacity-50"
                  >
                    {downloading === doc.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Download size={12} strokeWidth={2.2} />
                    }
                    {downloading === doc.id ? "…" : "Download"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
