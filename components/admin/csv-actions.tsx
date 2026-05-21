"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, X, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { deleteAllProducts } from "@/app/admin/products/actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type ImportResult = {
  imported?: number;
  updated?:  number;
  skipped?:  number;
  errors?:   { row: number; message: string }[];
  message?:  string;
  // Capture anything extra the backend sends, for debugging
  [key: string]: unknown;
};

type ModalState =
  | { phase: "idle" }
  | { phase: "picking" }
  | { phase: "uploading" }
  | { phase: "done"; result: ImportResult }
  | { phase: "error"; message: string };

type DeleteAllState =
  | { phase: "idle" }
  | { phase: "confirm"; typed: string }
  | { phase: "deleting" }
  | { phase: "done"; deleted?: number }
  | { phase: "error"; message: string };

// ── Shared button styles ───────────────────────────────────────────────────────

const outlineBtnCls =
  "flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:border-black/20 hover:text-[#171a20] disabled:opacity-50 disabled:cursor-not-allowed";

// ─────────────────────────────────────────────────────────────────────────────

export default function CsvActions({
  currentView = "all",
}: {
  currentView?: "all" | "b2b" | "b2c";
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting]     = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [modal, setModal]             = useState<ModalState>({ phase: "idle" });
  const [deleteAll, setDeleteAll]     = useState<DeleteAllState>({ phase: "idle" });

  // Auto-close the import modal 3 seconds after a successful import
  useEffect(() => {
    if (modal.phase !== "done") return;
    const timer = setTimeout(() => {
      setModal({ phase: "idle" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 3000);
    return () => clearTimeout(timer);
  }, [modal.phase]);

  // Auto-close the delete-all success modal after 3 seconds
  useEffect(() => {
    if (deleteAll.phase !== "done") return;
    const timer = setTimeout(() => setDeleteAll({ phase: "idle" }), 3000);
    return () => clearTimeout(timer);
  }, [deleteAll.phase]);

  // ── Delete All ──────────────────────────────────────────────────────────────

  const handleDeleteAll = async () => {
    setDeleteAll({ phase: "deleting" });
    const result = await deleteAllProducts("delete-all-products");
    if (result.error) {
      setDeleteAll({ phase: "error", message: result.error });
    } else {
      router.refresh();
      setDeleteAll({ phase: "done", deleted: result.deleted });
    }
  };

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);

    try {
      const url = currentView !== "all"
        ? `/api/admin/products/export?segment=${currentView}`
        : "/api/admin/products/export";

      const res = await fetch(url);

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setExportError(json.error ?? `Export failed (HTTP ${res.status}).`);
        return;
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");

      // Use filename from Content-Disposition; proxy also sets a segment-aware fallback
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="?([^";\n]+)"?/i);
      const date = new Date().toISOString().slice(0, 10);
      const segmentSuffix = currentView !== "all" ? `-${currentView}` : "";
      a.download = match?.[1] ?? `products${segmentSuffix}-${date}.csv`;
      a.href = objectUrl;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setExportError("Network error — could not reach the server.");
    } finally {
      setExporting(false);
    }
  };

  // ── Import ──────────────────────────────────────────────────────────────────

  const openModal  = () => setModal({ phase: "picking" });
  const closeModal = () => {
    setModal({ phase: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setModal({ phase: "uploading" });

    // POST to the Next.js proxy route — it reads admin_token from the httpOnly
    // cookie server-side and forwards the file to Laravel.
    // Pass segment so the backend maps the price column to the right tier
    // (price_b2b or price_b2c) without touching the other tier.
    // Do NOT set Content-Type — the browser sets it with the multipart boundary.
    const form = new FormData();
    form.append("file", file);

    const importUrl =
      currentView === "b2b" ? "/api/admin/products/import?segment=b2b"
      : currentView === "b2c" ? "/api/admin/products/import?segment=b2c"
      : "/api/admin/products/import";

    try {
      const res = await fetch(importUrl, {
        method: "POST",
        body: form,
      });

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const json = await res.json().catch(() => ({
        error: "Server returned an unreadable response.",
      }));

      if (!res.ok) {
        setModal({
          phase: "error",
          message: json.error ?? json.message ?? `Import failed (HTTP ${res.status}).`,
        });
        return;
      }

      // Refresh the products list, then show the result summary
      router.refresh();
      setModal({ phase: "done", result: json as ImportResult });
    } catch {
      setModal({ phase: "error", message: "Network error — could not reach the server." });
    }
  };

  const selectedFile = fileInputRef.current?.files?.[0];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Buttons ── */}
      <div className="flex items-center gap-2">
        {/* Export error inline */}
        {exportError && (
          <span className="text-[0.78rem] font-medium text-red-500">{exportError}</span>
        )}

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className={outlineBtnCls}
          aria-label={`Export ${currentView === "b2b" ? "B2B" : currentView === "b2c" ? "B2C" : ""} products as CSV`}
        >
          {exporting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} strokeWidth={2} />
          )}
          {currentView === "b2b" ? "Export B2B" : currentView === "b2c" ? "Export B2C" : "Export CSV"}
        </button>

        <button
          type="button"
          onClick={openModal}
          className={outlineBtnCls}
          aria-label="Import products from CSV"
        >
          <Upload size={15} strokeWidth={2} />
          {currentView === "b2b" ? "Import B2B" : currentView === "b2c" ? "Import B2C" : "Import CSV"}
        </button>

        <button
          type="button"
          onClick={() => setDeleteAll({ phase: "confirm", typed: "" })}
          disabled={deleteAll.phase === "deleting"}
          className="flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2.5 text-[0.875rem] font-semibold text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Delete all products"
        >
          {deleteAll.phase === "deleting" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} strokeWidth={2} />
          )}
          Delete All
        </button>
      </div>

      {/* ── Import modal ── */}
      {modal.phase !== "idle" && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            aria-hidden="true"
            onClick={closeModal}
          />

          {/* Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Import products CSV"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white p-7 shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
          >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">
                  {currentView === "b2b" ? "B2B · Wholesale" : currentView === "b2c" ? "B2C · Retail" : "Products"}
                </p>
                <h2 className="mt-0.5 text-[1.1rem] font-extrabold text-[#171a20]">
                  {currentView === "b2b" ? "Import B2B Prices" : currentView === "b2c" ? "Import B2C Prices" : "Import CSV"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1.5 text-[#5c5e62] transition hover:bg-black/[0.05] hover:text-[#171a20]"
                aria-label="Close"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* ── Phase: picking / uploading ── */}
            {(modal.phase === "picking" || modal.phase === "uploading") && (
              <div className="flex flex-col gap-5">
                {/* File picker */}
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-[14px] border-2 border-dashed border-black/[0.12] bg-[#f5f5f5] px-6 py-8 text-center transition hover:border-[#E85C1A]/40 hover:bg-[#fff7f5]">
                  <Upload size={28} strokeWidth={1.5} className="text-[#E85C1A]" />
                  <div>
                    <p className="text-[0.9rem] font-semibold text-[#171a20]">
                      {selectedFile ? selectedFile.name : "Choose a CSV file"}
                    </p>
                    <p className="mt-0.5 text-[0.78rem] text-[#5c5e62]">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : "Click to browse or drag and drop"}
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={() => setModal({ phase: "picking" })} // re-render to show filename
                  />
                </label>

                {/* Segment-specific context */}
                {currentView !== "all" && (
                  <div className="flex items-start gap-2.5 rounded-[10px] border border-blue-200 bg-blue-50 p-3 text-[0.78rem] text-blue-800">
                    <span className="mt-0.5 shrink-0 text-base leading-none">ℹ</span>
                    <div>
                      {currentView === "b2b" ? (
                        <>
                          <strong>B2B import:</strong> the <code className="rounded bg-blue-100 px-1 font-mono">price</code> column will be stored as the <strong>wholesale (B2B) price</strong>. Existing B2C prices and product data are not affected. Safe to run multiple times.
                        </>
                      ) : (
                        <>
                          <strong>B2C import:</strong> the <code className="rounded bg-blue-100 px-1 font-mono">price</code> column will be stored as the <strong>retail (B2C) price</strong>. Existing B2B prices and product data are not affected. Safe to run multiple times.
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-[10px] border border-black/[0.07] bg-[#f9f9f9] p-3 text-[0.75rem] text-[#5c5e62]">
                  <p className="mb-1.5 font-bold text-[#1a1a1a]">Required columns</p>
                  <p className="mb-2 font-mono">
                    {["sku","brand","name","size","price","type"].map((c) => (
                      <code key={c} className="mr-1 rounded bg-black/[0.06] px-1 py-0.5">{c}</code>
                    ))}
                  </p>
                  <p className="mb-1.5 font-bold text-[#1a1a1a]">Optional columns</p>
                  <p className="font-mono leading-relaxed">
                    {["spec","season","visible","width","height","rim","load_index","speed_rating","inventory","cost","price_b2b","price_b2c"].map((c) => (
                      <code key={c} className="mr-1 rounded bg-black/[0.06] px-1 py-0.5">{c}</code>
                    ))}
                  </p>
                  <p className="mt-2">Rows with a matching SKU are <strong>updated</strong>, not duplicated. Products not in the CSV are left untouched. Images are preserved on update.</p>
                </div>
                <p className="text-[0.78rem] font-medium text-amber-600">
                  ⚠ Newly imported products are set to <strong>Inactive</strong> by default. After import, toggle each one to <strong>Active</strong> so they appear on the shop.
                </p>

                {/* Large file notice */}
                {selectedFile && selectedFile.size > 1_000_000 && modal.phase !== "uploading" && (
                  <p className="text-[0.75rem] text-[#5c5e62]">
                    ⏱ This file is {(selectedFile.size / 1_000_000).toFixed(1)} MB — large imports can take 1–3 minutes. Please keep this window open.
                  </p>
                )}

                {/* Uploading progress hint */}
                {modal.phase === "uploading" && (
                  <div className="flex items-center gap-2.5 rounded-[10px] bg-[#f9f9f9] px-4 py-3 text-[0.78rem] text-[#5c5e62]">
                    <Loader2 size={14} className="shrink-0 animate-spin text-[#E85C1A]" />
                    <span>Uploading and processing — this can take a few minutes for large catalogues. Do not close this window.</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={modal.phase === "uploading" || !fileInputRef.current?.files?.[0]}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E85C1A] py-3 text-[0.9rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {modal.phase === "uploading" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Upload size={15} strokeWidth={2} />
                        Upload and Import
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={modal.phase === "uploading"}
                    className="rounded-full border border-black/10 px-5 py-3 text-[0.9rem] font-semibold text-[#5c5e62] transition hover:bg-black/[0.04] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Phase: done ── */}
            {modal.phase === "done" && (
              <div className="flex flex-col gap-5">
                {/* Summary counts */}
                <div className="grid grid-cols-3 gap-2">
                  {(["imported", "updated", "skipped"] as const).map((key) => (
                    <div key={key} className="rounded-[10px] border border-black/[0.07] bg-[#f9f9f9] p-3 text-center">
                      <p className="text-[1.1rem] font-extrabold text-[#1a1a1a]">
                        {modal.result[key] ?? 0}
                      </p>
                      <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-[#5c5e62]">
                        {key}
                      </p>
                    </div>
                  ))}
                </div>

                {/* All-zero warning */}
                {!modal.result.imported && !modal.result.updated && !modal.result.skipped && (
                  <div className="flex items-start gap-2.5 rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-[0.78rem] text-amber-800">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <strong>Nothing was imported.</strong> The backend accepted the file but returned 0 counts.
                      {modal.result.message && (
                        <p className="mt-1 font-mono text-[0.72rem]">Backend message: &quot;{modal.result.message}&quot;</p>
                      )}
                      <p className="mt-1">Check the raw response below and share with the backend team.</p>
                    </div>
                  </div>
                )}

                {/* Backend message (when counts > 0) */}
                {(modal.result.imported || modal.result.updated) && modal.result.message && (
                  <p className="text-[0.78rem] text-emerald-700">{modal.result.message}</p>
                )}

                {/* Raw backend response — always visible for debugging */}
                <details className="rounded-[10px] border border-black/[0.07]">
                  <summary className="cursor-pointer px-3 py-2 text-[0.72rem] font-semibold text-[#5c5e62] hover:text-[#1a1a1a]">
                    Raw backend response
                  </summary>
                  <pre className="max-h-[120px] overflow-auto bg-[#f9f9f9] px-3 pb-3 text-[0.68rem] text-[#333]">
                    {JSON.stringify(modal.result, null, 2)}
                  </pre>
                </details>

                {/* Row errors — guard against backend not sending errors array */}
                {(modal.result.errors ?? []).length > 0 && (
                  <div>
                    {(() => {
                      const errs = modal.result.errors ?? [];
                      return (
                        <>
                          <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-wide text-red-600">
                            {errs.length} row{errs.length !== 1 ? "s" : ""} failed
                          </p>
                          <ul className="max-h-[180px] overflow-y-auto rounded-[10px] border border-red-100 bg-red-50 divide-y divide-red-100">
                            {errs.map((e, i) => (
                              <li key={i} className="flex items-start gap-2 px-3 py-2">
                                <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                                <span className="text-[0.78rem] text-red-700">
                                  <span className="font-semibold">Row {e.row}:</span> {e.message}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      );
                    })()}
                  </div>
                )}

                <p className="text-center text-[0.75rem] text-[#5c5e62]">
                  Closing automatically in 3 seconds…
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-full bg-[#171a20] py-3 text-[0.9rem] font-semibold text-white transition hover:bg-black"
                >
                  Close Now
                </button>
              </div>
            )}

            {/* ── Phase: error ── */}
            {modal.phase === "error" && (
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3 rounded-[12px] border border-red-200 bg-red-50 p-4">
                  <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-[0.9rem] font-semibold text-red-800">Import failed</p>
                    <p className="mt-1 text-[0.82rem] text-red-700">{modal.message}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModal({ phase: "picking" })}
                    className="flex-1 rounded-full bg-[#E85C1A] py-3 text-[0.9rem] font-semibold text-white transition hover:bg-[#d14f14]"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-black/10 px-5 py-3 text-[0.9rem] font-semibold text-[#5c5e62] transition hover:bg-black/[0.04]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Delete All modal ── */}
      {deleteAll.phase !== "idle" && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            aria-hidden="true"
            onClick={() => deleteAll.phase !== "deleting" && setDeleteAll({ phase: "idle" })}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Delete all products"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white p-7 shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
          >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-red-600">
                  Destructive Action
                </p>
                <h2 className="mt-0.5 text-[1.1rem] font-extrabold text-[#171a20]">
                  Delete All Products
                </h2>
              </div>
              {deleteAll.phase !== "deleting" && (
                <button
                  type="button"
                  onClick={() => setDeleteAll({ phase: "idle" })}
                  className="rounded-full p-1.5 text-[#5c5e62] transition hover:bg-black/[0.05] hover:text-[#171a20]"
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Phase: confirm */}
            {deleteAll.phase === "confirm" && (
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3 rounded-[12px] border border-red-200 bg-red-50 p-4">
                  <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-[0.88rem] font-semibold text-red-800">This will remove every product from the catalogue.</p>
                    <ul className="mt-2 space-y-1 text-[0.8rem] text-red-700">
                      <li>• All product records will be soft-deleted (moved to Trash)</li>
                      <li>• Product images linked to deleted records may be lost</li>
                      <li>• The shop will show no products until you re-import</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-[0.78rem] text-amber-800">
                  <strong>Tip:</strong> If you only want to update prices, use <strong>Import CSV</strong> instead — existing SKUs are updated in-place and images are preserved.
                </div>

                <div>
                  <p className="mb-2 text-[0.82rem] font-semibold text-[#1a1a1a]">
                    Type <span className="font-mono font-bold text-red-600">DELETE ALL</span> to confirm
                  </p>
                  <input
                    type="text"
                    value={deleteAll.typed}
                    onChange={(e) => setDeleteAll({ phase: "confirm", typed: e.target.value })}
                    placeholder="DELETE ALL"
                    className="w-full rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 font-mono text-[0.875rem] text-[#1a1a1a] outline-none placeholder:text-[#ccc] transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    disabled={deleteAll.typed !== "DELETE ALL"}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 py-3 text-[0.9rem] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                    Delete All Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteAll({ phase: "idle" })}
                    className="rounded-full border border-black/10 px-5 py-3 text-[0.9rem] font-semibold text-[#5c5e62] transition hover:bg-black/[0.04]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Phase: deleting */}
            {deleteAll.phase === "deleting" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <Loader2 size={36} className="animate-spin text-red-500" />
                <p className="text-[0.9rem] font-semibold text-[#1a1a1a]">Deleting all products…</p>
                <p className="text-[0.78rem] text-[#5c5e62]">This may take a moment for large catalogues.</p>
              </div>
            )}

            {/* Phase: done */}
            {deleteAll.phase === "done" && (
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-[0.9rem] font-semibold text-emerald-800">All products deleted</p>
                    {deleteAll.deleted != null && (
                      <p className="mt-1 text-[0.82rem] text-emerald-700">
                        <strong>{deleteAll.deleted}</strong> product{deleteAll.deleted !== 1 ? "s" : ""} moved to Trash.
                      </p>
                    )}
                    <p className="mt-1 text-[0.78rem] text-emerald-700">You can now import the new CSV file.</p>
                  </div>
                </div>
                <p className="text-center text-[0.75rem] text-[#5c5e62]">Closing automatically…</p>
                <button
                  type="button"
                  onClick={() => setDeleteAll({ phase: "idle" })}
                  className="w-full rounded-full bg-[#171a20] py-3 text-[0.9rem] font-semibold text-white transition hover:bg-black"
                >
                  Close Now
                </button>
              </div>
            )}

            {/* Phase: error */}
            {deleteAll.phase === "error" && (
              <div className="flex flex-col gap-5">
                <div className="flex items-start gap-3 rounded-[12px] border border-red-200 bg-red-50 p-4">
                  <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
                  <div>
                    <p className="text-[0.9rem] font-semibold text-red-800">Delete failed</p>
                    <p className="mt-1 text-[0.82rem] text-red-700">{deleteAll.message}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteAll({ phase: "confirm", typed: "" })}
                    className="flex-1 rounded-full bg-red-600 py-3 text-[0.9rem] font-semibold text-white transition hover:bg-red-700"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteAll({ phase: "idle" })}
                    className="rounded-full border border-black/10 px-5 py-3 text-[0.9rem] font-semibold text-[#5c5e62] transition hover:bg-black/[0.04]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
