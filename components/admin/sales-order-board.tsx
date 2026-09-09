"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock3, Download,
  Loader2, Paperclip, Plus, Trash2, X,
} from "lucide-react";
import type { SalesBoardEntry, SalesBoardKpis, SalesBoardLine, SalesBoardMeta } from "@/lib/admin-api";
import { formatMoney } from "@/lib/currency";
import { canDo } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

/**
 * Sales & Order Management board — finance's OT 3.html mockup. Hand-entered
 * orders itemizing customer revenue (with tyre quantities) against supplier
 * costs (with their documents). GP, margin, the verification status and the
 * five KPI cards all come computed from the server — this board renders,
 * it never re-derives.
 *
 * Everything wraps rather than truncates — the walkthrough rule.
 */

const INPUT =
  "h-8 w-full rounded-lg border border-black/[0.10] bg-white px-2 text-[0.78rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none disabled:bg-[#f8f9fa] disabled:text-[#8c8f94]";
const LABEL = "mb-1 block text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]";
const TH = "px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]";

function monthLabel(period: string): string {
  const m = period.match(/^(\d{4})-(\d{2})$/);
  if (!m) return period;
  return new Date(Number(m[1]), Number(m[2]) - 1, 1)
    .toLocaleString("en-GB", { month: "short", year: "numeric" });
}

export default function SalesOrderBoard() {
  const { role, permissions } = useAdminPermissions();
  const canManage = canDo(role ?? "", "finance.manage", permissions);

  const [entries, setEntries] = useState<SalesBoardEntry[]>([]);
  const [kpis, setKpis] = useState<SalesBoardKpis | null>(null);
  const [meta, setMeta] = useState<SalesBoardMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "pending">("all");
  const [periodFilter, setPeriodFilter] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  const [addingLineFor, setAddingLineFor] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusFilter !== "all") p.set("status", statusFilter);
      if (periodFilter) p.set("period", periodFilter);
      const res = await fetch(`/api/admin/sales-orders${p.size ? `?${p}` : ""}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.meta?.sales_orders_available === false) {
        setUnavailable(json.message ?? json.error ?? "The sales board isn't available on this server yet.");
        setEntries([]);
      } else {
        setUnavailable(null);
        setEntries(Array.isArray(json.data?.entries) ? json.data.entries : []);
        setKpis(json.data?.kpis ?? null);
        setMeta(json.meta ?? null);
      }
    } catch {
      setUnavailable("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, periodFilter]);

  useEffect(() => { void load(); }, [load]);

  async function patchEntry(entry: SalesBoardEntry, patch: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/admin/sales-orders/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.message ?? "Could not update the order."); return; }
    // Segment moves change the KPI split — reload rather than patch locally.
    await load();
  }

  async function removeEntry(entry: SalesBoardEntry) {
    if (!window.confirm(`Remove ${entry.order_no} and its ${entry.lines.length} line(s)?`)) return;
    const res = await fetch(`/api/admin/sales-orders/${entry.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.message ?? "Could not remove the order.");
      return;
    }
    await load();
  }

  async function patchLine(line: SalesBoardLine, patch: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/admin/sales-orders/lines/${line.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.message ?? "Could not update the line."); return; }
    await load();
  }

  async function removeLine(line: SalesBoardLine) {
    const res = await fetch(`/api/admin/sales-orders/lines/${line.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.message ?? "Could not remove the line."); return; }
    await load();
  }

  async function attachFile(line: SalesBoardLine, file: File) {
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/admin/sales-orders/lines/${line.id}/file`, { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.message ?? "Could not attach that file."); return; }
    await load();
  }

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  if (loading && !meta) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-8 text-[0.83rem] text-[#5c5e62]">
        <Loader2 size={14} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
        <p className="font-semibold">Not available on this server yet.</p>
        <p className="mt-0.5">{unavailable}</p>
      </div>
    );
  }

  const tile = "rounded-xl border border-black/[0.06] bg-white p-4";
  const tileLabel = "text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]";
  const tileValue = "mt-1 text-[1.2rem] font-bold tabular-nums text-[#171a20]";
  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition ${
      active ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
    }`;

  return (
    <div className="space-y-4">
      {/* ── The five KPI cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className={tile}>
          <p className={tileLabel}>Unique customers</p>
          <p className={tileValue}>{kpis?.unique_customers ?? 0}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>Tyres sold</p>
          <p className={tileValue}>{kpis?.tyres_sold ?? 0}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>Avg price / tyre</p>
          <p className={tileValue}>{kpis?.avg_price_per_tyre == null ? "—" : formatMoney(kpis.avg_price_per_tyre, "EUR")}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>B2B GP margin</p>
          <p className={tileValue}>{kpis?.b2b_margin_percent == null ? "—" : `${kpis.b2b_margin_percent}%`}</p>
        </div>
        <div className={tile}>
          <p className={tileLabel}>B2C GP margin</p>
          <p className={tileValue}>{kpis?.b2c_margin_percent == null ? "—" : `${kpis.b2c_margin_percent}%`}</p>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setStatusFilter("all")} className={chip(statusFilter === "all")}>
          All orders
        </button>
        <button type="button" onClick={() => setStatusFilter("pending")} className={chip(statusFilter === "pending")}>
          Pending proof
        </button>
        <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}
          className="h-8 cursor-pointer rounded-full border border-black/[0.10] bg-white px-3 pr-7 text-[0.78rem] font-semibold text-[#5c5e62] focus:border-[#f4511e] focus:outline-none">
          <option value="">All months</option>
          {(meta?.known_periods ?? []).map((p) => <option key={p} value={p}>{monthLabel(p)}</option>)}
        </select>
        {canManage && !adding && (
          <button type="button" onClick={() => setAdding(true)}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-[#f4511e] px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition hover:bg-[#df4618]">
            <Plus size={13} /> Add new order
          </button>
        )}
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[0.83rem] text-blue-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={13} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
          <span className="flex items-center gap-2"><AlertTriangle size={14} /> {error}</span>
          <button type="button" onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}

      {adding && meta && (
        <OrderForm meta={meta}
          onCancel={() => setAdding(false)}
          onDone={() => { setAdding(false); void load(); }} />
      )}

      {/* ── The orders table ────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-black/[0.06] bg-white p-8 text-center text-[0.83rem] text-[#8c8f94]">
          {statusFilter === "pending"
            ? "Nothing is waiting on supplier proof — every order on the board is verified."
            : "Nothing on the board yet — add an order to start."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                <th className={`${TH} w-8`} />
                <th className={TH}>Invoice no</th>
                <th className={TH}>Customer</th>
                <th className={TH}>Segment</th>
                <th className={TH}>Period</th>
                <th className={TH}>Category</th>
                <th className={TH}>Status</th>
                <th className={`${TH} text-right`}>GP margin</th>
                {canManage && <th className={`${TH} w-10`} />}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <EntryRows key={entry.id}
                  entry={entry} meta={meta} canManage={canManage}
                  open={expanded.has(entry.id)} onToggle={() => toggle(entry.id)}
                  addingLine={addingLineFor === entry.id}
                  onAddLine={() => setAddingLineFor(entry.id)}
                  onLineFormDone={(message) => {
                    setAddingLineFor(null);
                    if (message) setNotice(message);
                    void load();
                  }}
                  onLineFormCancel={() => setAddingLineFor(null)}
                  onPatchEntry={patchEntry} onRemoveEntry={removeEntry}
                  onPatchLine={patchLine} onRemoveLine={removeLine} onAttach={attachFile}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {statusFilter === "pending" && entries.length > 0 && (
        <p className="text-[0.72rem] text-[#8c8f94]">
          The KPI cards above still cover the whole board — this view narrows the rows, not the figures.
        </p>
      )}
    </div>
  );
}

// ── One order: summary row + expandable transaction lines ────────────────────

function EntryRows({
  entry, meta, canManage, open, onToggle,
  addingLine, onAddLine, onLineFormDone, onLineFormCancel,
  onPatchEntry, onRemoveEntry, onPatchLine, onRemoveLine, onAttach,
}: {
  entry: SalesBoardEntry;
  meta: SalesBoardMeta | null;
  canManage: boolean;
  open: boolean;
  onToggle: () => void;
  addingLine: boolean;
  onAddLine: () => void;
  onLineFormDone: (message: string | null) => void;
  onLineFormCancel: () => void;
  onPatchEntry: (entry: SalesBoardEntry, patch: Record<string, unknown>) => Promise<void>;
  onRemoveEntry: (entry: SalesBoardEntry) => Promise<void>;
  onPatchLine: (line: SalesBoardLine, patch: Record<string, unknown>) => Promise<void>;
  onRemoveLine: (line: SalesBoardLine) => Promise<void>;
  onAttach: (line: SalesBoardLine, file: File) => Promise<void>;
}) {
  const td = "px-3 py-2.5 text-[0.8rem] text-[#171a20] align-middle";
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <>
      <tr className="cursor-pointer border-b border-black/[0.04] transition hover:bg-[#f8fafc]" onClick={onToggle}>
        <td className={`${td} text-[#8c8f94]`}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
        <td className={td} onClick={stop}>
          {canManage ? (
            <input defaultValue={entry.order_no} className={INPUT}
              onBlur={(e) => e.target.value.trim() !== entry.order_no && e.target.value.trim() !== ""
                && void onPatchEntry(entry, { order_no: e.target.value.trim() })} />
          ) : (
            <span className="font-semibold">{entry.order_no}</span>
          )}
        </td>
        <td className={`${td} whitespace-normal break-words`} onClick={stop}>
          {canManage ? (
            <input defaultValue={entry.customer_name} className={INPUT}
              onBlur={(e) => e.target.value.trim() !== entry.customer_name && e.target.value.trim() !== ""
                && void onPatchEntry(entry, { customer_name: e.target.value.trim() })} />
          ) : (
            entry.customer_name
          )}
        </td>
        <td className={td} onClick={stop}>
          <select value={entry.segment} disabled={!canManage} className={`${INPUT} cursor-pointer`}
            onChange={(e) => void onPatchEntry(entry, { segment: e.target.value })}>
            {(meta?.segments ?? ["B2B", "B2C"]).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </td>
        <td className={td} onClick={stop}>
          {canManage ? (
            <input type="month" defaultValue={entry.period} className={INPUT}
              onBlur={(e) => e.target.value !== entry.period && e.target.value !== ""
                && void onPatchEntry(entry, { period: e.target.value })} />
          ) : (
            <span className="whitespace-nowrap">{monthLabel(entry.period)}</span>
          )}
        </td>
        <td className={td} onClick={stop}>
          <select value={entry.category} disabled={!canManage} className={`${INPUT} cursor-pointer`}
            onChange={(e) => void onPatchEntry(entry, { category: e.target.value })}>
            {(meta?.categories ?? ["New Tyres", "Used Tyres", "FET"]).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </td>
        <td className={td}>
          {entry.status === "verified" ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.7rem] font-bold text-emerald-700">
              <CheckCircle2 size={11} /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.7rem] font-bold text-amber-700">
              <Clock3 size={11} /> Pending proof
            </span>
          )}
        </td>
        <td className={`${td} text-right tabular-nums font-bold ${
          entry.margin_percent == null ? "text-[#8c8f94]" : entry.margin_percent >= 0 ? "text-emerald-700" : "text-red-600"
        }`}>
          {entry.margin_percent == null ? "—" : `${entry.margin_percent}%`}
        </td>
        {canManage && (
          <td className={td} onClick={stop}>
            <button type="button" onClick={() => void onRemoveEntry(entry)}
              className="text-[#8c8f94] transition hover:text-red-600" aria-label="Remove order">
              <Trash2 size={13} />
            </button>
          </td>
        )}
      </tr>

      {open && (
        <tr className="border-b border-black/[0.04] bg-[#f8fafc]">
          <td colSpan={canManage ? 9 : 8} className="px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[0.75rem] font-bold text-[#5c5e62]">Itemized invoices &amp; transaction lines</span>
              {canManage && !addingLine && (
                <button type="button" onClick={onAddLine}
                  className="flex items-center gap-1 rounded-full bg-[#f4511e] px-3 py-1 text-[0.72rem] font-semibold text-white transition hover:bg-[#df4618]">
                  <Plus size={11} /> Add line
                </button>
              )}
            </div>

            {addingLine && (
              <LineForm entryId={entry.id} onCancel={onLineFormCancel} onDone={onLineFormDone} />
            )}

            <table className="w-full rounded-xl bg-white">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  <th className={TH}>Party</th>
                  <th className={TH}>Customer / supplier name</th>
                  <th className={TH}>Invoice no</th>
                  <th className={`${TH} text-right`}>Tyres qty</th>
                  <th className={`${TH} text-right`}>Amount (€)</th>
                  <th className={TH}>Document</th>
                  {canManage && <th className={`${TH} w-8`} />}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05]">
                {entry.lines.map((line) => (
                  <LineRow key={line.id} line={line} canManage={canManage}
                    onPatch={onPatchLine} onRemove={onRemoveLine} onAttach={onAttach} />
                ))}
              </tbody>
            </table>

            <p className="mt-2 text-right text-[0.72rem] font-bold text-[#5c5e62]">
              Customer {formatMoney(entry.revenue, "EUR")} · Supplier {formatMoney(entry.costs, "EUR")} · Gross profit{" "}
              <span className={entry.gross_profit >= 0 ? "text-emerald-700" : "text-red-600"}>
                {formatMoney(entry.gross_profit, "EUR")}
              </span>
            </p>
          </td>
        </tr>
      )}
    </>
  );
}

function LineRow({
  line, canManage, onPatch, onRemove, onAttach,
}: {
  line: SalesBoardLine;
  canManage: boolean;
  onPatch: (line: SalesBoardLine, patch: Record<string, unknown>) => Promise<void>;
  onRemove: (line: SalesBoardLine) => Promise<void>;
  onAttach: (line: SalesBoardLine, file: File) => Promise<void>;
}) {
  const td = "px-3 py-2 text-[0.78rem] text-[#171a20] align-middle";
  const isCustomer = line.party_type === "customer";

  return (
    <tr>
      <td className={td}>
        <select value={line.party_type} disabled={!canManage}
          onChange={(e) => void onPatch(line, { party_type: e.target.value })}
          className={`h-8 w-full cursor-pointer rounded-lg border px-1.5 text-[0.72rem] font-bold ${
            isCustomer ? "border-blue-200 bg-blue-50 text-blue-700" : "border-black/[0.10] bg-white text-[#5c5e62]"
          }`}>
          <option value="customer">Customer</option>
          <option value="supplier">Supplier</option>
          <option value="credit_note">Credit note</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </td>
      <td className={`${td} whitespace-normal break-words`}>
        {canManage ? (
          <input defaultValue={line.party_name} className={INPUT}
            onBlur={(e) => e.target.value.trim() !== line.party_name && e.target.value.trim() !== ""
              && void onPatch(line, { party_name: e.target.value.trim() })} />
        ) : (
          line.party_name
        )}
      </td>
      <td className={td}>
        {canManage ? (
          <input defaultValue={line.invoice_no ?? ""} placeholder="INV / CN no" className={INPUT}
            onBlur={(e) => (e.target.value.trim() || null) !== (line.invoice_no ?? null)
              && void onPatch(line, { invoice_no: e.target.value.trim() })} />
        ) : (
          line.invoice_no ?? <span className="text-[#9ca3af]">n/a</span>
        )}
      </td>
      <td className={`${td} text-right tabular-nums`}>
        {isCustomer ? (
          canManage ? (
            <input type="number" min="0" defaultValue={line.tyre_qty} className={`${INPUT} text-right`}
              onBlur={(e) => Number(e.target.value) !== line.tyre_qty
                && void onPatch(line, { tyre_qty: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })} />
          ) : (
            line.tyre_qty
          )
        ) : (
          <span className="text-[#9ca3af]">n/a</span>
        )}
      </td>
      <td className={`${td} text-right tabular-nums`}>
        {canManage ? (
          <input type="number" step="0.01" min="0" defaultValue={line.amount} className={`${INPUT} text-right`}
            onBlur={(e) => Number(e.target.value) !== line.amount
              && void onPatch(line, { amount: Number(e.target.value) || 0 })} />
        ) : (
          formatMoney(line.amount, "EUR")
        )}
      </td>
      <td className={td}>
        {line.has_file ? (
          <a href={`/api/admin/sales-orders/lines/${line.id}/download`}
            className="inline-flex items-center gap-1 whitespace-normal break-all text-[0.72rem] font-semibold text-[#0284c7] underline-offset-2 hover:underline">
            <Download size={11} className="shrink-0" /> {line.file_name ?? "Document"}
          </a>
        ) : !canManage ? (
          <span className="text-[0.72rem] text-[#8c8f94]">missing</span>
        ) : (
          <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-dashed border-[#f4511e]/60 bg-[#fff7f2] px-2 py-1 text-[0.68rem] font-semibold text-[#f4511e]">
            <Paperclip size={10} /> Attach proof
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void onAttach(line, f); e.target.value = ""; }} />
          </label>
        )}
      </td>
      {canManage && (
        <td className={`${td} text-right`}>
          <button type="button" onClick={() => void onRemove(line)}
            className="text-[#8c8f94] transition hover:text-red-600" aria-label="Remove line">
            <Trash2 size={12} />
          </button>
        </td>
      )}
    </tr>
  );
}

// ── Forms ─────────────────────────────────────────────────────────────────────

function OrderForm({
  meta, onCancel, onDone,
}: {
  meta: SalesBoardMeta;
  onCancel: () => void;
  onDone: () => void;
}) {
  const now = new Date();
  const [orderNo, setOrderNo] = useState("");
  const [customer, setCustomer] = useState("");
  const [segment, setSegment] = useState("B2B");
  const [period, setPeriod] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [category, setCategory] = useState("New Tyres");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/admin/sales-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_no: orderNo, customer_name: customer, segment, period, category,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(json.message ?? "Could not add the invoice."); return; }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-black/[0.06] bg-white p-4">
      <p className="text-[0.72rem] font-bold uppercase tracking-wider text-[#5c5e62]">New invoice</p>
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] text-red-700">{formError}</p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div>
          <label className={LABEL}>Invoice no</label>
          <input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="INV-2026-003" required className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Customer name</label>
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} required className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Segment</label>
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className={`${INPUT} cursor-pointer`}>
            {meta.segments.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Period</label>
          <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} required className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${INPUT} cursor-pointer`}>
            {meta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <p className="text-[0.72rem] text-[#8c8f94]">
        The order starts with its customer line — set the amount and tyre quantity after adding, then
        record the supplier lines with their documents.
      </p>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-50">
          {busy && <Loader2 size={12} className="animate-spin" />} Add invoice
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full border border-black/10 px-4 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function LineForm({
  entryId, onCancel, onDone,
}: {
  entryId: number;
  onCancel: () => void;
  onDone: (message: string | null) => void;
}) {
  const [partyType, setPartyType] = useState<"customer" | "supplier" | "credit_note" | "cancelled">("supplier");
  const [name, setName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [qty, setQty] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("party_type", partyType);
      fd.append("party_name", name);
      if (invoiceNo.trim()) fd.append("invoice_no", invoiceNo.trim());
      if (partyType === "customer" && qty) fd.append("tyre_qty", qty);
      if (amount) fd.append("amount", amount);
      if (file) fd.append("file", file);
      const res = await fetch(`/api/admin/sales-orders/${entryId}/lines`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(json.message ?? "Could not add the line."); return; }
      onDone(json.message && !String(json.message).endsWith("added.") ? String(json.message) : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-3 space-y-3 rounded-xl border border-black/[0.06] bg-white p-3">
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] text-red-700">{formError}</p>
      )}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6">
        <div>
          <label className={LABEL}>Party</label>
          <select value={partyType} onChange={(e) => setPartyType(e.target.value as "customer" | "supplier" | "credit_note" | "cancelled")}
            className={`${INPUT} cursor-pointer`}>
            <option value="supplier">Supplier</option>
            <option value="customer">Customer</option>
            <option value="credit_note">Credit note</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={150} className={INPUT} />
        </div>
        {partyType === "customer" && (
          <div>
            <label className={LABEL}>Tyres qty</label>
            <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className={INPUT} />
          </div>
        )}
        <div>
          <label className={LABEL}>Invoice no</label>
          <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} maxLength={50}
            placeholder="INV / CN no" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Amount (€)</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className={INPUT} />
        </div>
        <div className={partyType === "customer" ? "" : "col-span-2"}>
          <label className={LABEL}>Document</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png"
            className="text-[0.72rem] file:mr-2 file:rounded-full file:border-0 file:bg-[#171a20] file:px-2.5 file:py-1 file:text-[0.68rem] file:font-semibold file:text-white"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-50">
          {busy && <Loader2 size={12} className="animate-spin" />} Save line
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full border border-black/10 px-4 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62]">
          Cancel
        </button>
      </div>
    </form>
  );
}
