"use client";

import { useRef, useState } from "react";
import {
  FileText, Download, ExternalLink, FilePlus2,
  Loader2, Upload, Trash2, X, Paperclip,
} from "lucide-react";
import type { TradeDocument } from "@/lib/admin-api";
import { canDo } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  proforma_invoice:   "Proforma Invoice",
  commercial_invoice: "Commercial Invoice",
  packing_list:       "Packing List",
  delivery_note:      "Delivery Note",
  shipment_document:  "Shipment Document",
  other:              "Document",
};

const STATUS_BADGE: Record<string, string> = {
  draft:  "bg-gray-100 text-gray-600",
  issued: "bg-blue-100 text-blue-700",
  sent:   "bg-emerald-100 text-emerald-700",
};

// Generated PDFs that always open inline in new tab
const INLINE_GENERATED = new Set(["commercial_invoice", "packing_list", "delivery_note"]);

// Short description shown below each document type label for UX clarity
const TYPE_DESCRIPTION: Record<string, string> = {
  proforma_invoice:   "Pre-shipment estimate",
  commercial_invoice: "Export / trade document",
  packing_list:       "Goods enumeration for customs",
  delivery_note:      "Delivery confirmation",
};

const SHIPMENT_LABELS = [
  "Bill of Lading",
  "CMR",
  "Air Waybill",
  "Customs Document",
  "Certificate of Origin",
  "Proof of Delivery",
  "Other",
];

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "xls", "xlsx", "csv"];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function fileExt(filename?: string | null): string {
  return (filename ?? "").split(".").pop()?.toLowerCase() ?? "";
}

function canViewInline(doc: TradeDocument): boolean {
  if (INLINE_GENERATED.has(doc.type)) return true;
  if (doc.type === "shipment_document") {
    const ext = fileExt(doc.original_filename);
    return ext === "pdf" || ext === "jpg" || ext === "jpeg" || ext === "png";
  }
  return false;
}

// ── Types ──────────────────────────────────────────────────────────────────────

type GenerateState = { loading: boolean; error: string | null };
const IDLE: GenerateState = { loading: false, error: null };

// ── Component ──────────────────────────────────────────────────────────────────

export default function TradeDocumentsCard({
  orderId,
  initialDocuments,
  adminRole,
}: {
  orderId: number;
  initialDocuments: TradeDocument[];
  /** Server-provided role — when present, skips the async cookie read in the hook. */
  adminRole?: string;
}) {
  // Use the server-provided role prop for an immediate synchronous check.
  // Fall back to the hook (async cookie read) only when the prop is absent.
  const { can, role: cookieRole, loading, permissions } = useAdminPermissions();
  const canManage = adminRole != null
    ? canDo(adminRole, "trade_documents.manage")
    : can("trade_documents.manage");

  // Documents state
  const [documents,   setDocuments]  = useState<TradeDocument[]>(initialDocuments);

  // Generate states
  const [proforma,    setProforma]   = useState<GenerateState>(IDLE);
  const [commercial,  setCommercial] = useState<GenerateState>(IDLE);
  const [packing,     setPacking]    = useState<GenerateState>(IDLE);
  const [delivery,    setDelivery]   = useState<GenerateState>(IDLE);

  // Download state
  const [downloading, setDownloading] = useState<number | null>(null);

  // Upload state
  const [showUpload,   setShowUpload]   = useState(false);
  const [uploadLabel,  setUploadLabel]  = useState("");
  const [uploadNotes,  setUploadNotes]  = useState("");
  const [uploadFile,   setUploadFile]   = useState<File | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [deleting,      setDeleting]      = useState<number | null>(null);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // Derived
  const hasProforma        = documents.some((d) => d.type === "proforma_invoice");
  const hasCommercialInv   = documents.some((d) => d.type === "commercial_invoice");
  const hasPacking         = documents.some((d) => d.type === "packing_list");
  const hasDeliveryNote    = documents.some((d) => d.type === "delivery_note");
  const generatedDocs   = documents.filter((d) => d.type !== "shipment_document");
  const shipmentDocs    = documents.filter((d) => d.type === "shipment_document");

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function generateDoc(
    endpoint: string,
    setState: (s: GenerateState) => void,
    label: string,
  ) {
    setState({ loading: true, error: null });
    try {
      const res  = await fetch(endpoint, { method: "POST" });
      const json = await res.json().catch(() => ({})) as { data?: TradeDocument; message?: string };
      if (res.ok && json.data) {
        setDocuments((prev) => [...prev, json.data!]);
        setState(IDLE);
      } else {
        setState({ loading: false, error: json.message ?? `Failed to generate ${label}. Please try again.` });
      }
    } catch {
      setState({ loading: false, error: "Network error. Please try again." });
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
        ?? `${doc.document_label ?? TYPE_LABEL[doc.type] ?? "document"}-${doc.number ?? doc.id}`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setDownloading(null);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setUploadError(null);
    if (!file) { setUploadFile(null); return; }
    const ext = fileExt(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(`File type ".${ext}" not allowed. Use: ${ALLOWED_EXTENSIONS.join(", ")}.`);
      setUploadFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("File exceeds 10 MB limit.");
      setUploadFile(null);
      e.target.value = "";
      return;
    }
    setUploadFile(file);
  }

  async function handleUpload() {
    if (!uploadLabel) { setUploadError("Select a document type."); return; }
    if (!uploadFile)  { setUploadError("Choose a file to upload."); return; }
    setUploading(true);
    setUploadError(null);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("document_label", uploadLabel);
    if (uploadNotes.trim()) fd.append("notes", uploadNotes.trim());
    try {
      const res  = await fetch(`/api/admin/orders/${orderId}/trade-documents/upload`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({})) as { data?: TradeDocument; message?: string };
      if (res.ok && json.data) {
        setDocuments((prev) => [...prev, json.data!]);
        setShowUpload(false);
        setUploadLabel("");
        setUploadNotes("");
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setUploadError(json.message ?? "Upload failed. Please try again.");
      }
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: number) {
    setDeleting(docId);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/trade-documents/${docId}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        setConfirmDelete(null);
      } else {
        const json = await res.json().catch(() => ({})) as { message?: string };
        setDeleteError(json.message ?? "Delete failed. Please try again.");
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  // ── Shared action button ──────────────────────────────────────────────────────

  function ActionBtn({ doc }: { doc: TradeDocument }) {
    if (canViewInline(doc)) {
      return (
        <a
          href={`/api/admin/trade-documents/${doc.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/[0.09] bg-white px-3 text-[0.75rem] font-semibold text-[#1a1a1a] transition hover:border-[#E85C1A]/40 hover:text-[#E85C1A]"
        >
          <ExternalLink size={13} strokeWidth={2} />
          View
        </a>
      );
    }
    return (
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
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">

      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#E85C1A]">
          Trade Documents
        </p>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {!hasProforma && (
              <button type="button" disabled={proforma.loading}
                onClick={() => generateDoc(`/api/admin/orders/${orderId}/trade-documents/proforma`, setProforma, "proforma invoice")}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E85C1A]/30 bg-[#fff5f2] px-3 py-1.5 text-[0.75rem] font-semibold text-[#E85C1A] transition hover:bg-[#fff0ea] disabled:opacity-60"
              >
                {proforma.loading ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : <FilePlus2 size={13} strokeWidth={2} />}
                {proforma.loading ? "Generating…" : "Generate Proforma"}
              </button>
            )}
            {!hasCommercialInv && (
              <button type="button" disabled={commercial.loading}
                onClick={() => generateDoc(`/api/admin/orders/${orderId}/trade-documents/commercial-invoice`, setCommercial, "commercial invoice")}
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-[0.75rem] font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-60"
              >
                {commercial.loading ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : <FilePlus2 size={13} strokeWidth={2} />}
                {commercial.loading ? "Generating…" : "Generate Commercial Invoice"}
              </button>
            )}
            {!hasPacking && (
              <button type="button" disabled={packing.loading}
                onClick={() => generateDoc(`/api/admin/orders/${orderId}/trade-documents/packing-list`, setPacking, "packing list")}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[0.75rem] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
              >
                {packing.loading ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : <FilePlus2 size={13} strokeWidth={2} />}
                {packing.loading ? "Generating…" : "Generate Packing List"}
              </button>
            )}
            {!hasDeliveryNote && (
              <button type="button" disabled={delivery.loading}
                onClick={() => generateDoc(`/api/admin/orders/${orderId}/trade-documents/delivery-note`, setDelivery, "delivery note")}
                className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-[0.75rem] font-semibold text-teal-700 transition hover:bg-teal-100 disabled:opacity-60"
              >
                {delivery.loading ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : <FilePlus2 size={13} strokeWidth={2} />}
                {delivery.loading ? "Generating…" : "Generate Delivery Note"}
              </button>
            )}
            <button type="button"
              onClick={() => { setShowUpload((v) => !v); setUploadError(null); }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] font-semibold transition ${
                showUpload
                  ? "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Upload size={13} strokeWidth={2} />
              Upload Document
            </button>
          </div>
        )}
      </div>

      {/* ── DEBUG PANEL — remove before production ── */}
      {process.env.NODE_ENV !== "production" && (
        <details className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[0.72rem]">
          <summary className="cursor-pointer font-bold text-amber-700">
            [DEBUG] Trade Documents Permissions
          </summary>
          <div className="mt-2 space-y-0.5 font-mono text-amber-900">
            <p>adminRole prop: <strong>{adminRole ?? "(not passed)"}</strong></p>
            <p>cookieRole (hook): <strong>{loading ? "loading…" : (cookieRole || "(empty)")}</strong></p>
            <p>permissions cookie: <strong>{permissions ? JSON.stringify(permissions) : "(none)"}</strong></p>
            <p>canManage: <strong>{String(canManage)}</strong></p>
            <p>hasCommercialInv: <strong>{String(hasCommercialInv)}</strong></p>
            <p>existing types: <strong>[{documents.map((d) => d.type).join(", ") || "none"}]</strong></p>
          </div>
        </details>
      )}

      {/* ── Generate errors ── */}
      {proforma.error   && <p className="mb-3 text-[0.8rem] text-red-600">{proforma.error}</p>}
      {commercial.error && <p className="mb-3 text-[0.8rem] text-red-600">{commercial.error}</p>}
      {packing.error    && <p className="mb-3 text-[0.8rem] text-red-600">{packing.error}</p>}
      {delivery.error   && <p className="mb-3 text-[0.8rem] text-red-600">{delivery.error}</p>}
      {deleteError      && <p className="mb-3 text-[0.8rem] text-red-600">{deleteError}</p>}

      {/* ── Generated documents ── */}
      {generatedDocs.length === 0 && shipmentDocs.length === 0 ? (
        <p className="text-[0.875rem] text-[#5c5e62]">No trade documents have been issued yet.</p>
      ) : (
        <>
          {generatedDocs.length > 0 && (
            <div className="divide-y divide-black/[0.05]">
              {generatedDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 py-3">
                  <FileText size={18} strokeWidth={1.5} className="shrink-0 text-[#5c5e62]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                        {TYPE_LABEL[doc.type] ?? doc.type}
                      </p>
                      {doc.number && (
                        <span className="font-mono text-[0.72rem] text-[#5c5e62]">#{doc.number}</span>
                      )}
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.68rem] font-bold capitalize ${STATUS_BADGE[doc.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {doc.status}
                      </span>
                    </div>
                    {TYPE_DESCRIPTION[doc.type] && (
                      <p className="mt-0.5 text-[0.7rem] text-[#9ca3af]">{TYPE_DESCRIPTION[doc.type]}</p>
                    )}
                    <p className="mt-0.5 text-[0.75rem] text-[#5c5e62]">
                      Issued {shortDate(doc.issued_at)}
                      {doc.sent_at && ` · Sent ${shortDate(doc.sent_at)}`}
                    </p>
                  </div>
                  <ActionBtn doc={doc} />
                </div>
              ))}
            </div>
          )}

          {/* ── Shipment documents ── */}
          {shipmentDocs.length > 0 && (
            <div className={generatedDocs.length > 0 ? "mt-5" : ""}>
              <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#5c5e62]">
                Shipment Documents
              </p>
              <div className="divide-y divide-black/[0.05]">
                {shipmentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 py-3">
                    <Paperclip size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#5c5e62]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.875rem] font-semibold text-[#1a1a1a]">
                        {doc.document_label ?? "Shipment Document"}
                      </p>
                      <p className="mt-0.5 truncate text-[0.75rem] text-[#5c5e62]">
                        {doc.original_filename}
                        {doc.file_size ? ` · ${fmtSize(doc.file_size)}` : ""}
                      </p>
                      <p className="text-[0.72rem] text-[#9ca3af]">
                        Uploaded {shortDate(doc.issued_at)}
                        {doc.notes ? ` · ${doc.notes}` : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <ActionBtn doc={doc} />

                      {canManage && (
                        confirmDelete === doc.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id)}
                              disabled={deleting === doc.id}
                              className="inline-flex h-8 items-center gap-1 rounded-full bg-red-600 px-2.5 text-[0.72rem] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                            >
                              {deleting === doc.id ? <Loader2 size={11} className="animate-spin" /> : null}
                              {deleting === doc.id ? "…" : "Delete"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="inline-flex h-8 items-center rounded-full border border-black/[0.09] bg-white px-2.5 text-[0.72rem] font-semibold text-[#5c5e62] transition hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setConfirmDelete(doc.id); setDeleteError(null); }}
                            title="Delete document"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.09] bg-white text-[#9ca3af] transition hover:border-red-200 hover:text-red-500"
                          >
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Upload panel ── */}
      {canManage && showUpload && (
        <div className="mt-5 rounded-xl border border-black/[0.08] bg-[#fafafa] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[0.78rem] font-bold text-[#1a1a1a]">Upload Shipment Document</p>
            <button
              type="button"
              onClick={() => { setShowUpload(false); setUploadError(null); setUploadFile(null); }}
              className="text-[#9ca3af] transition hover:text-[#5c5e62]"
            >
              <X size={15} strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {/* Document type */}
            <div>
              <label className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={uploadLabel}
                onChange={(e) => setUploadLabel(e.target.value)}
                className="w-full rounded-lg border border-black/[0.1] bg-white px-3 py-2 text-[0.85rem] text-[#1a1a1a] focus:border-[#E85C1A]/50 focus:outline-none focus:ring-2 focus:ring-[#E85C1A]/10"
              >
                <option value="">Select document type…</option>
                {SHIPMENT_LABELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                Notes <span className="text-[#9ca3af]">(optional)</span>
              </label>
              <input
                type="text"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="e.g. Container TCNU1234567"
                className="w-full rounded-lg border border-black/[0.1] bg-white px-3 py-2 text-[0.85rem] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#E85C1A]/50 focus:outline-none focus:ring-2 focus:ring-[#E85C1A]/10"
              />
            </div>

            {/* File picker */}
            <div>
              <label className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                File <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-black/[0.15] bg-white px-3 py-2 text-[0.82rem] text-[#5c5e62] transition hover:border-[#E85C1A]/40 hover:text-[#E85C1A]">
                  <Paperclip size={14} strokeWidth={2} />
                  {uploadFile ? uploadFile.name : "Choose file…"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
                {uploadFile && (
                  <span className="text-[0.72rem] text-[#9ca3af]">{fmtSize(uploadFile.size)}</span>
                )}
              </div>
              <p className="mt-1 text-[0.68rem] text-[#9ca3af]">
                PDF, JPG, PNG, XLS, XLSX, CSV · max 10 MB
              </p>
            </div>

            {uploadError && (
              <p className="text-[0.8rem] text-red-600">{uploadError}</p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#E85C1A] px-4 py-2 text-[0.8rem] font-semibold text-white transition hover:bg-[#d04d15] disabled:opacity-60"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} strokeWidth={2} />}
                {uploading ? "Uploading…" : "Upload"}
              </button>
              <button
                type="button"
                onClick={() => { setShowUpload(false); setUploadError(null); setUploadFile(null); }}
                className="rounded-full border border-black/[0.08] px-4 py-2 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
