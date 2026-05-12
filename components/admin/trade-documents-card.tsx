"use client";

import { useState } from "react";
import { FileText, Download, ExternalLink, FilePlus2, Loader2 } from "lucide-react";
import type { TradeDocument } from "@/lib/admin-api";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

const TYPE_LABEL: Record<string, string> = {
  proforma_invoice:   "Proforma Invoice",
  commercial_invoice: "Commercial Invoice",
  packing_list:       "Packing List",
  other:              "Document",
};

const STATUS_BADGE: Record<string, string> = {
  draft:  "bg-gray-100 text-gray-600",
  issued: "bg-blue-100 text-blue-700",
  sent:   "bg-emerald-100 text-emerald-700",
};

// Packing lists open inline in a new tab; other doc types are force-downloaded.
const INLINE_TYPES = new Set(["packing_list"]);

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

export default function TradeDocumentsCard({
  orderId,
  initialDocuments,
}: {
  orderId: number;
  initialDocuments: TradeDocument[];
}) {
  const { can } = useAdminPermissions();

  const [documents,          setDocuments]         = useState<TradeDocument[]>(initialDocuments);
  const [generating,         setGenerating]         = useState(false);
  const [generateError,      setGenerateError]      = useState<string | null>(null);
  const [generatingPacking,  setGeneratingPacking]  = useState(false);
  const [packingError,       setPackingError]       = useState<string | null>(null);
  const [downloading,        setDownloading]        = useState<number | null>(null);

  const hasProforma = documents.some((d) => d.type === "proforma_invoice");
  const hasPacking  = documents.some((d) => d.type === "packing_list");
  const canManage   = can("trade_documents.manage");

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/trade-documents/proforma`,
        { method: "POST" },
      );
      const json = await res.json().catch(() => ({})) as { data?: TradeDocument; message?: string };
      if (res.ok && json.data) {
        setDocuments((prev) => [...prev, json.data!]);
      } else {
        setGenerateError(json.message ?? "Failed to generate proforma. Please try again.");
      }
    } catch {
      setGenerateError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleGeneratePacking() {
    setGeneratingPacking(true);
    setPackingError(null);
    try {
      const res = await fetch(
        `/api/admin/orders/${orderId}/trade-documents/packing-list`,
        { method: "POST" },
      );
      const json = await res.json().catch(() => ({})) as { data?: TradeDocument; message?: string };
      if (res.ok && json.data) {
        setDocuments((prev) => [...prev, json.data!]);
      } else {
        setPackingError(json.message ?? "Failed to generate packing list. Please try again.");
      }
    } catch {
      setPackingError("Network error. Please try again.");
    } finally {
      setGeneratingPacking(false);
    }
  }

  async function handleDownload(doc: TradeDocument) {
    setDownloading(doc.id);
    try {
      const res = await fetch(`/api/admin/trade-documents/${doc.id}/download`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = doc.original_filename
        ?? `${TYPE_LABEL[doc.type] ?? "document"}-${doc.number ?? doc.id}.pdf`;
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
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
          Trade Documents
        </p>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {!hasProforma && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E85C1A]/30 bg-[#fff5f2] px-3 py-1.5 text-[0.75rem] font-semibold text-[#E85C1A] transition hover:bg-[#fff0ea] disabled:opacity-60"
              >
                {generating
                  ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                  : <FilePlus2 size={13} strokeWidth={2} />
                }
                {generating ? "Generating…" : "Generate Proforma"}
              </button>
            )}

            {!hasPacking && (
              <button
                type="button"
                onClick={handleGeneratePacking}
                disabled={generatingPacking}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[0.75rem] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
              >
                {generatingPacking
                  ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                  : <FilePlus2 size={13} strokeWidth={2} />
                }
                {generatingPacking ? "Generating…" : "Generate Packing List"}
              </button>
            )}
          </div>
        )}
      </div>

      {generateError && (
        <p className="mb-4 text-[0.8rem] text-red-600">{generateError}</p>
      )}
      {packingError && (
        <p className="mb-4 text-[0.8rem] text-red-600">{packingError}</p>
      )}

      {documents.length === 0 ? (
        <p className="text-[0.875rem] text-[#5c5e62]">
          No trade documents have been issued yet.
        </p>
      ) : (
        <div className="divide-y divide-black/[0.05]">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 py-3">
              <FileText
                size={18}
                strokeWidth={1.5}
                className="shrink-0 text-[#5c5e62]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                    {TYPE_LABEL[doc.type] ?? doc.type}
                  </p>
                  {doc.number && (
                    <span className="font-mono text-[0.72rem] text-[#5c5e62]">
                      #{doc.number}
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold capitalize ${STATUS_BADGE[doc.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {doc.status}
                  </span>
                </div>
                <p className="mt-0.5 text-[0.75rem] text-[#5c5e62]">
                  Issued {shortDate(doc.issued_at)}
                  {doc.sent_at && ` · Sent ${shortDate(doc.sent_at)}`}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {INLINE_TYPES.has(doc.type) ? (
                  <a
                    href={`/api/admin/trade-documents/${doc.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[0.09] bg-white px-3 text-[0.75rem] font-semibold text-[#1a1a1a] transition hover:border-[#E85C1A]/40 hover:text-[#E85C1A]"
                  >
                    <ExternalLink size={13} strokeWidth={2} />
                    View PDF
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[0.09] bg-white px-3 text-[0.75rem] font-semibold text-[#1a1a1a] transition hover:border-[#E85C1A]/40 hover:text-[#E85C1A] disabled:opacity-50"
                  >
                    {downloading === doc.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Download size={13} strokeWidth={2} />
                    }
                    {downloading === doc.id ? "…" : "Download"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
