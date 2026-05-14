"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type EbayLog = {
  id:              number;
  product_id?:     number | null;
  sku?:            string | null;
  action:          string;
  ebay_item_id?:   string | null;
  ebay_offer_id?:  string | null;
  status?:         string | null;
  error_message?:  string | null;
  response_code?:  number | null;
  admin_user_id?:  number | null;
  created_at:      string;
};

type LogsMeta = {
  total?:        number;
  current_page?: number;
  last_page?:    number;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  { value: "",                       label: "All actions" },
  { value: "publish",                label: "Published" },
  { value: "publish_failed",         label: "Publish failed" },
  { value: "remove",                 label: "Removed" },
  { value: "remove_failed",          label: "Remove failed" },
  { value: "sync",                   label: "Synced" },
  { value: "sync_failed",            label: "Sync failed" },
  { value: "refresh_status",         label: "Status refresh" },
  { value: "refresh_status_failed",  label: "Refresh failed" },
] as const;

const ACTION_BADGE: Record<string, string> = {
  publish:               "bg-green-100 text-green-700",
  publish_failed:        "bg-red-100 text-red-700",
  remove:                "bg-gray-100 text-gray-700",
  remove_failed:         "bg-red-100 text-red-700",
  sync:                  "bg-blue-100 text-blue-700",
  sync_failed:           "bg-red-100 text-red-700",
  refresh_status:        "bg-sky-100 text-sky-700",
  refresh_status_failed: "bg-red-100 text-red-700",
};

const ACTION_LABEL: Record<string, string> = {
  publish:               "Published",
  publish_failed:        "Publish Failed",
  remove:                "Removed",
  remove_failed:         "Remove Failed",
  sync:                  "Synced",
  sync_failed:           "Sync Failed",
  refresh_status:        "Status Refresh",
  refresh_status_failed: "Refresh Failed",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ActionBadge({ action }: { action: string }) {
  const cls   = ACTION_BADGE[action] ?? "bg-gray-100 text-gray-600";
  const label = ACTION_LABEL[action] ?? action.replace(/_/g, " ");
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-bold capitalize ${cls}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-[0.72rem] text-[#ccc]">—</span>;
  const isOk = status === "success" || status === "ok";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${isOk ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {status}
    </span>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function EbayLogsPanel({ canManage }: { canManage: boolean }) {
  const [open, setOpen]         = useState(false);
  const [logs, setLogs]         = useState<EbayLog[]>([]);
  const [meta, setMeta]         = useState<LogsMeta>({});
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [everLoaded, setEverLoaded] = useState(false);

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterSku, setFilterSku]       = useState("");
  const [filterFrom, setFilterFrom]     = useState("");
  const [filterTo, setFilterTo]         = useState("");
  const [page, setPage]                 = useState(1);

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async (opts?: {
    action?: string; sku?: string; from?: string; to?: string; page?: number;
  }) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    const action = opts?.action !== undefined ? opts.action : filterAction;
    const sku    = opts?.sku    !== undefined ? opts.sku    : filterSku;
    const from   = opts?.from   !== undefined ? opts.from   : filterFrom;
    const to     = opts?.to     !== undefined ? opts.to     : filterTo;
    const pg     = opts?.page   !== undefined ? opts.page   : page;

    if (action) params.set("action", action);
    if (sku.trim()) params.set("sku", sku.trim());
    if (from) params.set("from", from);
    if (to)   params.set("to",   to);
    params.set("page", String(pg));
    params.set("per_page", "20");

    try {
      const res  = await fetch(`/api/admin/ebay/logs?${params}`);
      if (res.status === 401) { setError("Session expired."); return; }
      if (!res.ok) {
        // Endpoint not yet deployed — show graceful empty state
        setLogs([]);
        setMeta({});
        return;
      }
      const json = await res.json() as { data?: EbayLog[]; meta?: LogsMeta };
      setLogs(Array.isArray(json.data) ? json.data : []);
      setMeta(json.meta ?? {});
      setEverLoaded(true);
    } catch {
      setError("Could not load logs.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load when panel first opens
  useEffect(() => {
    if (open && !everLoaded) void fetchLogs();
  }, [open, everLoaded, fetchLogs]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const applyFilters = () => {
    setPage(1);
    void fetchLogs({ action: filterAction, sku: filterSku, from: filterFrom, to: filterTo, page: 1 });
  };

  const clearFilters = () => {
    setFilterAction("");
    setFilterSku("");
    setFilterFrom("");
    setFilterTo("");
    setPage(1);
    void fetchLogs({ action: "", sku: "", from: "", to: "", page: 1 });
  };

  const lastPage = meta.last_page ?? 1;
  const hasFilters = !!(filterAction || filterSku.trim() || filterFrom || filterTo);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">

      {/* Panel toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[#fafafa]"
      >
        <div>
          <p className="text-[0.83rem] font-extrabold text-[#1a1a1a]">eBay Listing Logs</p>
          {meta.total !== undefined && !loading && (
            <p className="mt-0.5 text-[0.72rem] text-[#5c5e62]">
              {meta.total} event{meta.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-[#5c5e62]" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-[#5c5e62]" />
        )}
      </button>

      {open && (
        <div className="border-t border-black/[0.06]">

          {/* Filter bar */}
          <div className="flex flex-wrap items-end gap-3 px-5 py-4">
            {/* Action */}
            <div className="flex flex-col gap-1">
              <label className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="h-9 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.8rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A]"
              >
                {ACTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* SKU */}
            <div className="flex flex-col gap-1">
              <label className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">SKU</label>
              <input
                type="text"
                value={filterSku}
                onChange={(e) => setFilterSku(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Filter by SKU…"
                className="h-9 w-44 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] text-[#1a1a1a] outline-none placeholder:text-[#bbb] transition focus:border-[#E85C1A]"
              />
            </div>

            {/* Date from */}
            <div className="flex flex-col gap-1">
              <label className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">From</label>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="h-9 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.8rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A]"
              />
            </div>

            {/* Date to */}
            <div className="flex flex-col gap-1">
              <label className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">To</label>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="h-9 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.8rem] text-[#1a1a1a] outline-none transition focus:border-[#E85C1A]"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="h-9 rounded-lg bg-[#1a1a1a] px-4 text-[0.8rem] font-semibold text-white transition hover:bg-[#333]"
              >
                Apply
              </button>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex h-9 items-center gap-1 rounded-lg border border-black/[0.09] bg-white px-3 text-[0.8rem] text-[#5c5e62] transition hover:text-[#1a1a1a]"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => void fetchLogs()}
                title="Refresh logs"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#5c5e62] transition hover:text-[#1a1a1a]"
              >
                <RefreshCw size={13} strokeWidth={2} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-5 mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  {["Action", "SKU / Product", "eBay Item ID", "Status", "Error", "When"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <Loader2 size={18} className="mx-auto animate-spin text-[#5c5e62]" />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[0.83rem] text-[#5c5e62]">
                      {everLoaded ? "No logs found for the selected filters." : "Logs endpoint not yet available."}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-[#fafafa]">

                      {/* Action */}
                      <td className="px-5 py-3">
                        <ActionBadge action={log.action} />
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-3">
                        <p className="text-[0.78rem] font-mono font-semibold text-[#1a1a1a]">
                          {log.sku ?? "—"}
                        </p>
                        {log.product_id && (
                          <p className="text-[0.68rem] text-[#aaa]">ID {log.product_id}</p>
                        )}
                      </td>

                      {/* eBay Item ID */}
                      <td className="px-5 py-3">
                        {log.ebay_item_id ? (
                          <a
                            href={`https://www.ebay.de/itm/${log.ebay_item_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-mono text-[0.72rem] text-blue-600 underline hover:text-blue-800"
                          >
                            {log.ebay_item_id}
                            <ExternalLink size={9} strokeWidth={2} />
                          </a>
                        ) : (
                          <span className="text-[0.72rem] text-[#ccc]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <StatusBadge status={log.status} />
                      </td>

                      {/* Error */}
                      <td className="px-5 py-3 max-w-[260px]">
                        {log.error_message ? (
                          <p
                            className="truncate text-[0.73rem] text-red-600"
                            title={log.error_message}
                          >
                            {log.error_message}
                          </p>
                        ) : (
                          <span className="text-[0.72rem] text-[#ccc]">—</span>
                        )}
                      </td>

                      {/* When */}
                      <td className="px-5 py-3 whitespace-nowrap text-[0.73rem] text-[#5c5e62]">
                        {fmtDate(log.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
              <p className="text-[0.78rem] text-[#5c5e62]">
                Page {page} of {lastPage}
                {typeof meta.total === "number" && ` · ${meta.total} events`}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => {
                    const prev = page - 1;
                    setPage(prev);
                    void fetchLogs({ page: prev });
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#1a1a1a] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:pointer-events-none disabled:bg-[#f5f5f5] disabled:text-[#ccc]"
                >
                  ‹
                </button>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    void fetchLogs({ page: next });
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] bg-white text-[#1a1a1a] transition hover:border-[#E85C1A] hover:text-[#E85C1A] disabled:pointer-events-none disabled:bg-[#f5f5f5] disabled:text-[#ccc]"
                >
                  ›
                </button>
              </div>
            </div>
          )}

          {!canManage && (
            <p className="px-5 py-3 text-[0.75rem] text-[#aaa]">
              Read-only — your role cannot perform eBay actions.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
