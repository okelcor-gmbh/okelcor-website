"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ImportResult = {
  imported: number;
  updated:  number;
  skipped:  number;
  errors:   { row: number; message: string }[];
};

type ModalState =
  | { phase: "idle" }
  | { phase: "picking" }
  | { phase: "uploading" }
  | { phase: "done"; result: ImportResult }
  | { phase: "error"; message: string };

// ── Shared button styles ───────────────────────────────────────────────────────

const outlineBtnCls =
  "flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-[0.875rem] font-semibold text-[#5c5e62] transition hover:border-black/20 hover:text-[#171a20] disabled:opacity-50 disabled:cursor-not-allowed";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ─────────────────────────────────────────────────────────────────────────────

export default function OrdersCsvActions() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting]     = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [modal, setModal]             = useState<ModalState>({ phase: "idle" });

  // Auto-close 3 s after a successful import then hard-navigate to
  // /admin/orders with no filter params. A hard navigation (window.location)
  // is used instead of router.push/refresh because router.push() to the
  // current pathname can be a no-op in Next.js App Router, leaving stale
  // data on screen. Hard nav guarantees a fresh server render.
  useEffect(() => {
    if (modal.phase !== "done") return;
    const timer = setTimeout(() => {
      setModal({ phase: "idle" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      window.location.href = "/admin/orders";
    }, 3000);
    return () => clearTimeout(timer);
  }, [modal.phase]);

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);

    // Fetch bearer token from httpOnly cookie via token route
    let token: string | null = null;
    try {
      const tokenRes  = await fetch("/api/admin/token");
      const tokenJson = await tokenRes.json().catch(() => ({}));
      token = tokenJson.token ?? null;
    } catch {
      setExportError("Network error — could not reach the server.");
      setExporting(false);
      return;
    }

    if (!token) {
      setExportError("Session expired — please refresh the page and log in again.");
      setExporting(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/admin/orders/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setExportError(json.error ?? json.message ?? `Export failed (HTTP ${res.status}).`);
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");

      const disposition = res.headers.get("content-disposition") ?? "";
      const match       = disposition.match(/filename="?([^";\n]+)"?/i);
      a.download = match?.[1] ?? `okelcor_orders_${new Date().toISOString().slice(0, 10)}.csv`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
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

    // Step 1 — get bearer token from httpOnly cookie
    let token: string | null = null;
    try {
      const tokenRes  = await fetch("/api/admin/token");
      const tokenJson = await tokenRes.json().catch(() => ({}));
      token = tokenJson.token ?? null;
    } catch {
      setModal({ phase: "error", message: "Network error — could not reach the server." });
      return;
    }

    if (!token) {
      setModal({ phase: "error", message: "Session expired — please refresh the page and log in again." });
      return;
    }

    // Step 2 — POST directly to Laravel, bypassing Vercel's 4.5 MB body limit
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API_URL}/admin/orders/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const json = await res.json().catch(() => ({
        message: "Server returned an unreadable response.",
      }));

      if (!res.ok) {
        const msg =
          res.status === 401
            ? "Session expired — please refresh the page and log in again."
            : json.error ?? json.message ?? `Import failed (HTTP ${res.status}).`;
        setModal({ phase: "error", message: msg });
        return;
      }

      // Show the result modal first, then refresh server-component data
      // in the background. The auto-close timer navigates to /admin/orders
      // (no filters) so newly imported "delivered" orders are visible.
      setModal({ phase: "done", result: json.data as ImportResult });
      router.refresh();
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
        {exportError && (
          <span className="text-[0.78rem] font-medium text-red-500">{exportError}</span>
        )}

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className={outlineBtnCls}
          aria-label="Export orders as CSV"
        >
          {exporting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} strokeWidth={2} />
          )}
          Export CSV
        </button>

        <button
          type="button"
          onClick={openModal}
          className={outlineBtnCls}
          aria-label="Import orders from CSV"
        >
          <Upload size={15} strokeWidth={2} />
          Import CSV
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
            aria-label="Import orders CSV"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-[22px] bg-white p-7 shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
          >
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#f4511e]">
                  Orders
                </p>
                <h2 className="mt-0.5 text-[1.1rem] font-extrabold text-[#171a20]">
                  Import Wix CSV
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
                <label className="flex cursor-pointer flex-col items-center gap-3 rounded-[14px] border-2 border-dashed border-black/[0.12] bg-[#f5f5f5] px-6 py-8 text-center transition hover:border-[#f4511e]/40 hover:bg-[#fff7f5]">
                  <Upload size={28} strokeWidth={1.5} className="text-[#f4511e]" />
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
                    onChange={() => setModal({ phase: "picking" })}
                  />
                </label>

                <p className="text-[0.78rem] text-[#5c5e62]">
                  Upload a <strong>Wix orders CSV export</strong>. Existing orders matched by order number will be updated, not duplicated. Order items are replaced on each run.
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={modal.phase === "uploading" || !fileInputRef.current?.files?.[0]}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#f4511e] py-3 text-[0.9rem] font-semibold text-white transition hover:bg-[#df4618] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {modal.phase === "uploading" ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading…
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
                <div className="flex items-start gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-[0.9rem] font-semibold text-emerald-800">Import complete</p>
                    <p className="mt-1 text-[0.82rem] text-emerald-700">
                      <strong>{modal.result.imported}</strong> imported ·{" "}
                      <strong>{modal.result.updated}</strong> updated ·{" "}
                      <strong>{modal.result.skipped}</strong> skipped
                    </p>
                  </div>
                </div>

                {modal.result.errors.length > 0 && (
                  <div>
                    <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-wide text-red-600">
                      {modal.result.errors.length} row{modal.result.errors.length !== 1 ? "s" : ""} failed
                    </p>
                    <ul className="max-h-[180px] overflow-y-auto rounded-[10px] border border-red-100 bg-red-50 divide-y divide-red-100">
                      {modal.result.errors.map((e, i) => (
                        <li key={i} className="flex items-start gap-2 px-3 py-2">
                          <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                          <span className="text-[0.78rem] text-red-700">
                            <span className="font-semibold">Row {e.row}:</span> {e.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-center text-[0.75rem] text-[#5c5e62]">
                  Closing automatically in 3 seconds…
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setModal({ phase: "idle" });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    window.location.href = "/admin/orders";
                  }}
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
                    className="flex-1 rounded-full bg-[#f4511e] py-3 text-[0.9rem] font-semibold text-white transition hover:bg-[#df4618]"
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
    </>
  );
}
