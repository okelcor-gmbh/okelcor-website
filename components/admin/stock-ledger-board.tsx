"use client";

/**
 * The finance stock ledger, built from finance's own draft (stock.html)
 * in the panel's console style: physical used-tyre stock by brand, size
 * and condition grade. Supplier invoices book stock in (lines merge,
 * latest cost wins); customer sale invoices book stock out (whole
 * invoice shortage-checked server-side); every booking lands in the
 * transaction log. Reads need finance.view; the two forms finance.manage.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, History,
  Loader2, Plus, RefreshCw, Search, Trash2, X,
} from "lucide-react";
import PageHeader from "@/components/admin/page-header";
import { canDo } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

type StockItem = {
  id: number;
  brand: string;
  size: string;
  tread: string | null;
  grade: string;
  qty: number;
  cost: number;
};

type TransactionLine = {
  brand: string; size: string; grade: string; qty: number; unit_price: number;
};

type StockTransaction = {
  id: number;
  type: "supplier" | "customer";
  party_name: string;
  reference: string | null;
  total_qty: number;
  total_amount: number;
  lines: TransactionLine[];
  created_at: string | null;
};

type SupplierLine = { brand: string; size: string; tread: string; grade: string; qty: string; unit_cost: string };
type CustomerLine = { stock_item_id: string; qty: string; unit_price: string };

const GRADE_STYLE: Record<string, string> = {
  "Grade A": "bg-emerald-50 text-emerald-700",
  "Grade B": "bg-amber-50 text-amber-700",
  "Grade C": "bg-red-50 text-red-600",
};

const INPUT = "h-9 w-full rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.82rem] text-[#1a1a1a] outline-none transition focus:border-[#f4511e]";
const TH = "px-3 py-2.5 text-left text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]";

const emptySupplierLine = (): SupplierLine => ({ brand: "", size: "", tread: "", grade: "Grade A", qty: "1", unit_cost: "" });
const emptyCustomerLine = (): CustomerLine => ({ stock_item_id: "", qty: "1", unit_price: "" });

type Tab = "inventory" | "supplier" | "customer" | "history";

export default function StockLedgerBoard() {
  const { role, permissions } = useAdminPermissions();
  const canManage = canDo(role ?? "", "finance.manage", permissions);

  const [items, setItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [totalPcs, setTotalPcs] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [grades, setGrades] = useState<string[]>(["Grade A", "Grade B", "Grade C"]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("inventory");
  const [q, setQ] = useState("");

  // Supplier invoice form
  const [supName, setSupName] = useState("");
  const [supInvNo, setSupInvNo] = useState("");
  const [supLines, setSupLines] = useState<SupplierLine[]>([emptySupplierLine()]);
  const [supBusy, setSupBusy] = useState(false);
  const [supError, setSupError] = useState<string | null>(null);

  // Customer invoice form
  const [custName, setCustName] = useState("");
  const [custContact, setCustContact] = useState("");
  const [custLines, setCustLines] = useState<CustomerLine[]>([emptyCustomerLine()]);
  const [custBusy, setCustBusy] = useState(false);
  const [custError, setCustError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stock", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setPageError(json.message ?? "Could not load the stock ledger."); setLoading(false); return; }
      setItems(Array.isArray(json.data?.items) ? json.data.items : []);
      setTransactions(Array.isArray(json.data?.transactions) ? json.data.transactions : []);
      setTotalPcs(json.meta?.total_pcs ?? 0);
      setTotalSales(json.meta?.total_sales ?? 0);
      if (Array.isArray(json.meta?.grades) && json.meta.grades.length) setGrades(json.meta.grades);
      setPageError(null);
    } catch {
      setPageError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => `${i.brand} ${i.size} ${i.grade}`.toLowerCase().includes(term));
  }, [items, q]);

  const supTotal = supLines.reduce((n, l) => n + (Number(l.qty) || 0) * (Number(l.unit_cost) || 0), 0);
  const custTotal = custLines.reduce((n, l) => n + (Number(l.qty) || 0) * (Number(l.unit_price) || 0), 0);

  async function submitSupplier(e: React.FormEvent) {
    e.preventDefault();
    setSupBusy(true);
    setSupError(null);
    try {
      const res = await fetch("/api/admin/stock?op=supplier-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_name: supName,
          invoice_no: supInvNo,
          lines: supLines.map((l) => ({
            brand: l.brand.trim(), size: l.size.trim(), tread: l.tread.trim() || null,
            grade: l.grade, qty: Number(l.qty), unit_cost: Number(l.unit_cost),
          })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setSupError(json.message ?? "Could not book the invoice."); return; }
      setNotice(json.message ?? "Supplier invoice booked.");
      setSupName(""); setSupInvNo(""); setSupLines([emptySupplierLine()]);
      setTab("inventory");
      void load();
    } finally {
      setSupBusy(false);
    }
  }

  async function submitCustomer(e: React.FormEvent) {
    e.preventDefault();
    setCustBusy(true);
    setCustError(null);
    try {
      const res = await fetch("/api/admin/stock?op=customer-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: custName,
          contact: custContact.trim() || null,
          lines: custLines.map((l) => ({
            stock_item_id: Number(l.stock_item_id), qty: Number(l.qty), unit_price: Number(l.unit_price),
          })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setCustError(json.message ?? "Could not book the sale."); return; }
      setNotice(json.message ?? "Sales invoice booked.");
      setCustName(""); setCustContact(""); setCustLines([emptyCustomerLine()]);
      setTab("inventory");
      void load();
    } finally {
      setCustBusy(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={22} className="animate-spin text-[#f4511e]" /></div>;
  }

  if (pageError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <AlertTriangle size={32} className="mb-3 text-amber-400" strokeWidth={1.5} />
        <p className="mb-1 text-[1rem] font-bold text-[#1a1a1a]">Stock ledger unavailable</p>
        <p className="mb-5 max-w-sm text-[0.83rem] text-[#6b7280]">{pageError}</p>
        <button type="button" onClick={() => { setLoading(true); void load(); }}
          className="flex items-center gap-2 rounded-full bg-[#f4511e] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#df4618]">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { key: "inventory", label: "Inventory", icon: Boxes },
    ...(canManage ? [
      { key: "supplier" as Tab, label: "Stock In (Supplier Invoice)", icon: ArrowDownToLine },
      { key: "customer" as Tab, label: "Stock Out (Customer Invoice)", icon: ArrowUpFromLine },
    ] : []),
    { key: "history", label: "Transaction Log", icon: History },
  ];

  return (
    <div className="p-6 lg:p-8">
      <PageHeader eyebrow="Finance" title="Stock Ledger"
        sub="Physical used-tyre stock: supplier invoices book it in, customer invoices sell it out.">
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-2 shadow-sm">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Current stock</p>
            <p className="text-[1.05rem] font-extrabold tabular-nums text-emerald-600">{totalPcs} pcs</p>
          </div>
          <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-2 shadow-sm">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Sales revenue</p>
            <p className="text-[1.05rem] font-extrabold tabular-nums text-[#1a1a1a]">{eur.format(totalSales)}</p>
          </div>
          <button type="button" onClick={() => { void load(); }} title="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-white text-[#5c5e62] transition hover:text-[#1a1a1a]">
            <RefreshCw size={14} />
          </button>
        </div>
      </PageHeader>

      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[0.83rem] text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss"><X size={13} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.78rem] font-bold transition ${
              tab === t.key ? "bg-[#1a1a1a] text-white" : "bg-white text-[#5c5e62] ring-1 ring-black/[0.08] hover:bg-[#f0f2f5]"
            }`}>
            <t.icon size={13} className={tab === t.key ? "text-[#f4511e]" : undefined} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Inventory ─────────────────────────────────────────────────────── */}
      {tab === "inventory" && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          <div className="border-b border-black/[0.05] p-3">
            <div className="relative max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Filter by brand, size or grade…"
                className="h-9 w-full rounded-full border border-black/[0.09] bg-white pl-8 pr-3 text-[0.8rem] outline-none transition focus:border-[#f4511e]" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[0.82rem]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  <th className={TH}>Tyre</th>
                  <th className={TH}>Tread / Condition</th>
                  <th className={`${TH} text-right`}>In stock</th>
                  <th className={`${TH} text-right`}>Latest cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {visibleItems.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-10 text-center text-[#9ca3af]">
                    {items.length === 0 ? "No stock yet. Book a supplier invoice to bring pieces in." : "Nothing matches this filter."}
                  </td></tr>
                )}
                {visibleItems.map((i) => (
                  <tr key={i.id}>
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-[#1a1a1a]">{i.brand}</p>
                      <p className="text-[0.72rem] text-[#9ca3af]">{i.size}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      {i.tread && <span className="mr-2 text-[0.78rem] text-[#5c5e62]">{i.tread}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${GRADE_STYLE[i.grade] ?? "bg-gray-100 text-gray-500"}`}>{i.grade}</span>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-bold tabular-nums ${i.qty > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {i.qty} pcs
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular-nums">{eur.format(i.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Supplier invoice (stock in) ───────────────────────────────────── */}
      {tab === "supplier" && canManage && (
        <form onSubmit={submitSupplier} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
          <p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#5c5e62]">New supplier invoice · stock in</p>
          {supError && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.8rem] text-red-700">{supError}</p>}
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-[#8c8f94]">Supplier name</label>
              <input value={supName} onChange={(e) => setSupName(e.target.value)} required maxLength={190}
                placeholder="e.g. Continental Wholesale Ltd" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-[#8c8f94]">Invoice no</label>
              <input value={supInvNo} onChange={(e) => setSupInvNo(e.target.value)} required maxLength={100}
                placeholder="e.g. SUP-INV-9920" className={INPUT} />
            </div>
          </div>

          <div className="mb-3 overflow-x-auto rounded-lg ring-1 ring-black/[0.06]">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  <th className={TH}>Brand</th>
                  <th className={TH}>Size</th>
                  <th className={TH}>Tread</th>
                  <th className={TH}>Condition</th>
                  <th className={`${TH} w-20 text-right`}>Qty</th>
                  <th className={`${TH} w-28 text-right`}>Unit cost</th>
                  <th className={`${TH} w-10`} />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {supLines.map((l, idx) => (
                  <tr key={idx}>
                    <td className="p-1.5"><input value={l.brand} required placeholder="Michelin"
                      onChange={(e) => setSupLines((ls) => ls.map((x, i) => i === idx ? { ...x, brand: e.target.value } : x))} className={INPUT} /></td>
                    <td className="p-1.5"><input value={l.size} required placeholder="235/60 R18"
                      onChange={(e) => setSupLines((ls) => ls.map((x, i) => i === idx ? { ...x, size: e.target.value } : x))} className={INPUT} /></td>
                    <td className="p-1.5"><input value={l.tread} placeholder="7.5 mm"
                      onChange={(e) => setSupLines((ls) => ls.map((x, i) => i === idx ? { ...x, tread: e.target.value } : x))} className={INPUT} /></td>
                    <td className="p-1.5">
                      <select value={l.grade}
                        onChange={(e) => setSupLines((ls) => ls.map((x, i) => i === idx ? { ...x, grade: e.target.value } : x))}
                        className={`${INPUT} cursor-pointer`}>
                        {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                    <td className="p-1.5"><input type="number" min="1" value={l.qty} required
                      onChange={(e) => setSupLines((ls) => ls.map((x, i) => i === idx ? { ...x, qty: e.target.value } : x))} className={`${INPUT} text-right`} /></td>
                    <td className="p-1.5"><input type="number" step="0.01" min="0" value={l.unit_cost} required placeholder="40.00"
                      onChange={(e) => setSupLines((ls) => ls.map((x, i) => i === idx ? { ...x, unit_cost: e.target.value } : x))} className={`${INPUT} text-right`} /></td>
                    <td className="p-1.5 text-center">
                      {supLines.length > 1 && (
                        <button type="button" aria-label="Remove line"
                          onClick={() => setSupLines((ls) => ls.filter((_, i) => i !== idx))}
                          className="text-[#8c8f94] transition hover:text-red-600"><Trash2 size={13} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setSupLines((ls) => [...ls, emptySupplierLine()])}
              className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e]">
              <Plus size={13} /> Add tyre line
            </button>
            <p className="text-[0.95rem] font-extrabold tabular-nums text-[#1a1a1a]">Total purchase: {eur.format(supTotal)}</p>
          </div>

          <button type="submit" disabled={supBusy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f4511e] py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-50">
            {supBusy && <Loader2 size={13} className="animate-spin" />} Book supplier invoice
          </button>
        </form>
      )}

      {/* ── Customer invoice (stock out) ──────────────────────────────────── */}
      {tab === "customer" && canManage && (
        <form onSubmit={submitCustomer} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
          <p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#5c5e62]">New customer sale invoice · stock out</p>
          {custError && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.8rem] text-red-700">{custError}</p>}
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-[#8c8f94]">Customer name</label>
              <input value={custName} onChange={(e) => setCustName(e.target.value)} required maxLength={190}
                placeholder="e.g. Autohaus Schmidt GmbH" className={INPUT} />
            </div>
            <div>
              <label className="mb-1 block text-[0.7rem] font-bold uppercase tracking-wider text-[#8c8f94]">Phone / tax ID</label>
              <input value={custContact} onChange={(e) => setCustContact(e.target.value)} maxLength={100}
                placeholder="optional" className={INPUT} />
            </div>
          </div>

          <div className="mb-3 overflow-x-auto rounded-lg ring-1 ring-black/[0.06]">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  <th className={TH}>Item from stock</th>
                  <th className={`${TH} w-20 text-right`}>Qty</th>
                  <th className={`${TH} w-32 text-right`}>Selling price</th>
                  <th className={`${TH} w-28 text-right`}>Line total</th>
                  <th className={`${TH} w-10`} />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {custLines.map((l, idx) => {
                  const lineTotal = (Number(l.qty) || 0) * (Number(l.unit_price) || 0);
                  return (
                    <tr key={idx}>
                      <td className="p-1.5">
                        <select value={l.stock_item_id} required
                          onChange={(e) => {
                            const id = e.target.value;
                            const item = items.find((i) => String(i.id) === id);
                            setCustLines((ls) => ls.map((x, i) => i === idx ? {
                              ...x,
                              stock_item_id: id,
                              // Finance's rule from the draft: suggest cost plus 25 percent
                              unit_price: item ? (item.cost * 1.25).toFixed(2) : x.unit_price,
                            } : x));
                          }}
                          className={`${INPUT} cursor-pointer`}>
                          <option value="">Select item…</option>
                          {items.filter((i) => i.qty > 0).map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.brand} | {i.size} | {i.grade} ({i.qty} in stock)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-1.5"><input type="number" min="1" value={l.qty} required
                        onChange={(e) => setCustLines((ls) => ls.map((x, i) => i === idx ? { ...x, qty: e.target.value } : x))} className={`${INPUT} text-right`} /></td>
                      <td className="p-1.5"><input type="number" step="0.01" min="0" value={l.unit_price} required placeholder="0.00"
                        onChange={(e) => setCustLines((ls) => ls.map((x, i) => i === idx ? { ...x, unit_price: e.target.value } : x))} className={`${INPUT} text-right`} /></td>
                      <td className="p-1.5 text-right font-mono tabular-nums text-[0.82rem]">{eur.format(lineTotal)}</td>
                      <td className="p-1.5 text-center">
                        {custLines.length > 1 && (
                          <button type="button" aria-label="Remove line"
                            onClick={() => setCustLines((ls) => ls.filter((_, i) => i !== idx))}
                            className="text-[#8c8f94] transition hover:text-red-600"><Trash2 size={13} /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setCustLines((ls) => [...ls, emptyCustomerLine()])}
              className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:border-[#f4511e] hover:text-[#f4511e]">
              <Plus size={13} /> Add tyre line
            </button>
            <p className="text-[0.95rem] font-extrabold tabular-nums text-[#1a1a1a]">Invoice total: {eur.format(custTotal)}</p>
          </div>

          <button type="submit" disabled={custBusy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-[0.88rem] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
            {custBusy && <Loader2 size={13} className="animate-spin" />} Book sales invoice
          </button>
        </form>
      )}

      {/* ── Transaction log ───────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[0.82rem]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  <th className={TH}>Date</th>
                  <th className={TH}>Type</th>
                  <th className={TH}>Party / Reference</th>
                  <th className={TH}>Items</th>
                  <th className={`${TH} text-right`}>Qty</th>
                  <th className={`${TH} text-right`}>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[#9ca3af]">No transactions yet.</td></tr>
                )}
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[#5c5e62]">
                      {t.created_at ? new Date(t.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${
                        t.type === "supplier" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                      }`}>{t.type === "supplier" ? "Stock in" : "Stock out"}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-bold text-[#1a1a1a]">{t.party_name}</p>
                      {t.reference && <p className="text-[0.72rem] text-[#9ca3af]">{t.reference}</p>}
                    </td>
                    <td className="max-w-[320px] px-3 py-2.5 text-[0.78rem] text-[#5c5e62]">
                      {t.lines.map((l) => `${l.qty}x ${l.brand} ${l.size} (${l.grade})`).join(" · ")}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{t.total_qty} pcs</td>
                    <td className="px-3 py-2.5 text-right font-bold tabular-nums">{eur.format(t.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
