"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, ExternalLink, FileText, Loader2, Lock, Paperclip, Upload } from "lucide-react";
import type { TradeDocument } from "@/lib/admin-api";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

const TYPE_LABEL: Record<string, string> = {
  order_confirmation: "Order Confirmation",
  proforma_invoice:   "Proforma Invoice",
  proforma_signed:    "Signed Proforma Invoice",
  commercial_invoice: "Commercial Invoice",
  packing_list:       "Packing List",
  delivery_note:      "Delivery Note",
  shipment_document:  "Shipment Document",
  other:              "Document",
};

// Short description shown below the document name to clarify purpose
const TYPE_DESCRIPTION: Record<string, string> = {
  order_confirmation: "Confirmed order summary",
  proforma_invoice:   "Pre-shipment estimate",
  proforma_signed:    "Signed & returned by you",
  commercial_invoice: "Export / trade document",
  packing_list:       "Goods enumeration for customs",
  delivery_note:      "Delivery confirmation",
};

const MAX_SIGNED_COPY_BYTES = 20 * 1024 * 1024;
const SIGNED_COPY_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

// Document types that require EU certificate sign-off before download
const GATED_TYPES = new Set(["commercial_invoice", "final_invoice"]);

// Generated doc types that always open inline in a new tab
const INLINE_GENERATED = new Set(["order_confirmation", "commercial_invoice", "final_invoice", "packing_list", "delivery_note"]);

function shortDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(iso));
  } catch { return iso; }
}

function fmtSize(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canViewInline(doc: TradeDocument): boolean {
  if (INLINE_GENERATED.has(doc.type)) return true;
  if (doc.type === "shipment_document") {
    const ext = (doc.original_filename ?? "").split(".").pop()?.toLowerCase();
    return ext === "pdf" || ext === "jpg" || ext === "jpeg" || ext === "png";
  }
  return false;
}

export default function TradeDocumentsCard({
  orderRef,
  documents,
  declarationRequired,
  declarationStatus,
  acceptancePending,
}: {
  orderRef: string;
  documents: TradeDocument[];
  declarationRequired?: boolean | null;
  declarationStatus?: "pending" | "signed" | "acknowledged" | null;
  /** When true, hides any proforma_invoice — customer must accept AB first. */
  acceptancePending?: boolean;
}) {
  const { customer } = useCustomerAuth();
  const [downloading, setDownloading] = useState<number | null>(null);
  const [docs, setDocs] = useState<TradeDocument[]>(documents);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => { setDocs(documents); }, [documents]);

  async function handleSignedCopyUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (file.size > MAX_SIGNED_COPY_BYTES) {
      setUploadError("That file is too large — max 20MB.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/account/orders/${orderRef}/proforma/signed-copy`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError((json as { message?: string }).message ?? "Couldn't upload the signed copy. Please try again.");
        return;
      }
      const data = (json as { data?: { id: number; original_filename?: string } }).data;
      setDocs((prev) => [
        ...prev,
        {
          id: data?.id ?? Date.now(),
          type: "proforma_signed",
          status: "issued",
          original_filename: data?.original_filename ?? file.name,
          issued_at: new Date().toISOString(),
        },
      ]);
    } catch {
      setUploadError("Network error — please try again.");
    } finally {
      setUploading(false);
    }
  }

  // CRM-4: If documents access is explicitly disabled, show blocked message.
  // Guard only activates when the field is explicitly false — never for
  // existing customers where approved_for_documents is undefined.
  if (customer && customer.approved_for_documents === false) {
    return (
      <div className="rounded-[18px] bg-[#efefef] p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <Lock size={20} strokeWidth={1.6} className="text-amber-600" />
        </div>
        <p className="text-[0.9rem] font-semibold text-[var(--foreground)]">
          Document access pending
        </p>
        <p className="mt-1 text-[0.82rem] leading-5 text-[var(--muted)]">
          Trade document access has not yet been enabled for your account.
          Please contact Okelcor to request access.
        </p>
      </div>
    );
  }

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
      a.download = doc.original_filename ?? `${TYPE_LABEL[doc.type] ?? "document"}.pdf`;
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

  // Customer-visible statuses: issued and sent only — draft/superseded/void hidden
  const HIDDEN_STATUSES = new Set(["draft", "superseded", "void"]);

  const tradeDocs    = docs.filter(
    (d) =>
      d.type !== "shipment_document" &&
      !HIDDEN_STATUSES.has(d.status) &&
      // Hide proforma until customer has accepted the order confirmation
      !(acceptancePending && d.type === "proforma_invoice"),
  );
  const shipmentDocs = docs.filter(
    (d) => d.type === "shipment_document" && !HIDDEN_STATUSES.has(d.status),
  );

  const hasProforma       = tradeDocs.some((d) => d.type === "proforma_invoice");
  const hasSignedProforma = tradeDocs.some((d) => d.type === "proforma_signed");

  // Show empty state when there are genuinely no customer-visible docs
  if (tradeDocs.length === 0 && shipmentDocs.length === 0) {
    return (
      <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:mb-5 sm:text-[11px]">
          Documents
        </p>
        <p className="text-[0.83rem] text-[var(--muted)]">No documents have been issued yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] bg-[#efefef] p-4 sm:rounded-[22px] sm:p-6 lg:p-8">

      {/* ── Trade Documents ── */}
      {tradeDocs.length > 0 && (
        <>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:mb-5 sm:text-[11px]">
            Documents
          </p>
          <div className="flex flex-col gap-2">
            {tradeDocs.map((doc) => {
              const locked = isLocked(doc);
              const inline = !locked && canViewInline(doc);
              return (
                <div key={doc.id} className="flex items-center gap-3 rounded-[12px] bg-white px-4 py-3">
                  <FileText
                    size={16}
                    strokeWidth={1.8}
                    className={`shrink-0 ${locked ? "text-[var(--muted)]" : "text-[var(--primary)]"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[0.88rem] font-semibold ${locked ? "text-[var(--muted)]" : "text-[var(--foreground)]"}`}>
                      {TYPE_LABEL[doc.type] ?? doc.type}
                    </p>
                    {TYPE_DESCRIPTION[doc.type] && (
                      <p className="text-[0.68rem] text-[var(--muted)]">{TYPE_DESCRIPTION[doc.type]}</p>
                    )}
                    {doc.number && (
                      <p className="font-mono text-[0.72rem] text-[var(--muted)]">#{doc.number}</p>
                    )}
                    <p className="text-[0.72rem] text-[var(--muted)]">Issued {shortDate(doc.issued_at)}</p>
                  </div>

                  {locked ? (
                    <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f5f5f5] px-3 text-[0.72rem] text-[var(--muted)]">
                      <Lock size={11} strokeWidth={2} />
                      Requires certificate
                    </div>
                  ) : inline ? (
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

          {/* ── Signed Proforma prompt / confirmation ── */}
          {hasProforma && (
            hasSignedProforma ? (
              <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-emerald-50 px-4 py-2.5 text-[0.78rem] font-semibold text-emerald-700">
                <CheckCircle2 size={14} strokeWidth={2.2} className="shrink-0" />
                Signed copy received
              </div>
            ) : (
              <div className="mt-3 rounded-[12px] border border-dashed border-[var(--primary)]/30 bg-white px-4 py-3.5">
                <p className="text-[0.85rem] font-semibold text-[var(--foreground)]">
                  Please print, sign, and return your proforma invoice
                </p>
                <p className="mt-0.5 text-[0.75rem] leading-relaxed text-[var(--muted)]">
                  Print the Proforma Invoice above, sign it (and stamp it, if applicable), then upload a scan or photo — PDF, JPG or PNG, up to 20MB.
                </p>
                <label className="mt-2.5 inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 text-[0.8rem] font-semibold text-white transition hover:opacity-90 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} strokeWidth={2.2} />}
                  {uploading ? "Uploading…" : "Upload signed copy"}
                  <input
                    type="file"
                    accept={SIGNED_COPY_ACCEPT}
                    className="hidden"
                    onChange={handleSignedCopyUpload}
                    disabled={uploading}
                  />
                </label>
                {uploadError && <p className="mt-2 text-[0.76rem] text-red-600">{uploadError}</p>}
              </div>
            )
          )}
        </>
      )}

      {/* ── Shipment Documents ── */}
      {shipmentDocs.length > 0 && (
        <div className={tradeDocs.length > 0 ? "mt-6" : ""}>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--primary)] sm:mb-5 sm:text-[11px]">
            Shipment Documents
          </p>
          <div className="flex flex-col gap-2">
            {shipmentDocs.map((doc) => {
              const inline = canViewInline(doc);
              return (
                <div key={doc.id} className="flex items-center gap-3 rounded-[12px] bg-white px-4 py-3">
                  <Paperclip size={15} strokeWidth={1.8} className="shrink-0 text-[var(--primary)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.88rem] font-semibold text-[var(--foreground)]">
                      {doc.document_label ?? "Shipment Document"}
                    </p>
                    <p className="truncate text-[0.72rem] text-[var(--muted)]">
                      {doc.original_filename}
                      {doc.file_size ? ` · ${fmtSize(doc.file_size)}` : ""}
                    </p>
                    <p className="text-[0.72rem] text-[var(--muted)]">
                      {shortDate(doc.issued_at)}
                    </p>
                  </div>

                  {inline ? (
                    <a
                      href={`/api/account/trade-documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f0f0f0] px-3 text-[0.75rem] font-semibold text-[var(--foreground)] transition hover:bg-[var(--primary)] hover:text-white"
                    >
                      <ExternalLink size={12} strokeWidth={2.2} />
                      View
                    </a>
                  ) : (
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
        </div>
      )}

    </div>
  );
}
