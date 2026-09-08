"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Download, FileText, Loader2, Plus,
  ShieldCheck, ShieldOff, Trash2, X,
} from "lucide-react";
import type { OrderCostLine, OrderProfitability } from "@/lib/admin-api";
import { formatMoney } from "@/lib/currency";
import { canDo } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

/**
 * One order's profitability: the finalized revenue invoice the customer agreed
 * to, the supplier invoices and fees against it, and finance's sign-off.
 *
 * All arithmetic comes from the server. Any edit that moves the money
 * withdraws a standing verification server-side, so after every mutation this
 * card refetches rather than patching local state — the sign-off box must
 * never show a signature the server has already withdrawn.
 */

const INPUT =
  "h-9 w-full rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none";
const LABEL = "mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]";
const TH = "px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]";
const TD = "px-3 py-2 text-[0.8rem] text-[#171a20]";

const FEE_CATEGORIES = ["stripe", "ebay", "bank", "shipping", "other"] as const;

const FEE_LABEL: Record<string, string> = {
  stripe: "Stripe", ebay: "eBay", bank: "Bank", shipping: "Shipping", other: "Other",
};

export default function OrderProfitabilityCard({
  orderId, adminRole,
}: {
  orderId: number;
  adminRole: string;
}) {
  const { permissions } = useAdminPermissions();
  const canManage = canDo(adminRole, "finance.manage", permissions);

  const [data, setData] = useState<OrderProfitability | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [revenueFormOpen, setRevenueFormOpen] = useState(false);
  const [costFormOpen, setCostFormOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/profitability`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUnavailable(json.message ?? json.error ?? "Profitability isn't available on this server yet.");
      } else {
        setUnavailable(null);
        setData(json.data as OrderProfitability);
      }
    } catch {
      setUnavailable("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { void load(); }, [load]);

  async function removeCost(line: OrderCostLine) {
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/profitability/costs/${line.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.message ?? "Could not remove this cost.");
      return;
    }
    await load();
  }

  async function verify() {
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/profitability/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.message ?? "Could not verify.");
      return;
    }
    setNotice("Profitability verified.");
    await load();
  }

  async function unverify() {
    const reason = window.prompt("Withdrawing finance's sign-off needs a written reason:");
    if (!reason) return;
    setError(null);
    const res = await fetch(`/api/admin/orders/${orderId}/profitability/verify`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.message ?? "Could not withdraw the verification.");
      return;
    }
    setNotice("Verification withdrawn.");
    await load();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-white p-8 text-[0.83rem] text-[#5c5e62] shadow-sm">
        <Loader2 size={14} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (unavailable || !data) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
        <p className="font-semibold">Not available on this server yet.</p>
        <p className="mt-0.5">{unavailable}</p>
      </div>
    );
  }

  const { revenue, costs, profit, verification, lines, context } = data;
  const verified = verification.verified;

  return (
    <div className="flex flex-col gap-5">
      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-800">
          <span className="flex items-center gap-2"><CheckCircle2 size={14} /> {notice}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={13} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <span className="flex items-center gap-2"><AlertTriangle size={14} /> {error}</span>
          <button type="button" onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}

      {/* ── The bottom line ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
        <p className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#f4511e]">
          Profitability
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">Revenue invoiced</p>
            <p className="mt-0.5 text-[1.1rem] font-bold tabular-nums text-[#171a20]">
              {revenue?.amount == null ? "—" : formatMoney(revenue.amount, revenue.currency)}
            </p>
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">Costs</p>
            <p className="mt-0.5 text-[1.1rem] font-bold tabular-nums text-[#171a20]">
              {formatMoney(costs.total, costs.currency)}
            </p>
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">Profit</p>
            <p className={`mt-0.5 text-[1.1rem] font-bold tabular-nums ${
              profit.amount == null ? "text-[#8c8f94]" : profit.amount >= 0 ? "text-emerald-700" : "text-red-600"
            }`}>
              {profit.amount == null ? "unknown" : formatMoney(profit.amount, profit.currency)}
            </p>
          </div>
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]">Margin</p>
            <p className="mt-0.5 text-[1.1rem] font-bold tabular-nums text-[#171a20]">
              {profit.margin_percent == null ? "—" : `${profit.margin_percent}%`}
            </p>
          </div>
        </div>

        {profit.mixed_currency && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[0.75rem] text-amber-800">
            Costs in {Object.entries(costs.other_currencies).map(([c, v]) => `${c} ${v}`).join(", ")} are
            recorded but excluded from the profit — matched by currency, never converted.
          </p>
        )}

        {/* Sign-off */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f8f9fa] px-4 py-3">
          {verified ? (
            <span className="flex items-center gap-2 text-[0.83rem] font-semibold text-emerald-700">
              <ShieldCheck size={15} />
              Signed off by {verification.verified_by ?? "finance"}
              {verification.verified_at && (
                <span className="font-normal text-[#8c8f94]">· {verification.verified_at.slice(0, 10)}</span>
              )}
              {verification.note && <span className="font-normal text-[#5c5e62]">— {verification.note}</span>}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-[0.83rem] text-[#5c5e62]">
              <ShieldOff size={15} className="text-[#8c8f94]" />
              Not signed off{revenue == null ? " — record the revenue invoice first" : ""}
            </span>
          )}
          {canManage && (
            verified ? (
              <button type="button" onClick={() => void unverify()}
                className="rounded-full bg-white px-3.5 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] ring-1 ring-black/[0.08] transition hover:bg-[#f0f2f5]">
                Withdraw sign-off
              </button>
            ) : (
              <button type="button" onClick={() => void verify()} disabled={revenue == null}
                title={revenue == null ? "There is no figure to sign yet." : undefined}
                className="rounded-full bg-[#171a20] px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-black disabled:opacity-40">
                Sign off
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Revenue invoice ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#f4511e]">
            Revenue invoice
          </p>
          {canManage && !revenueFormOpen && (
            <button type="button" onClick={() => setRevenueFormOpen(true)}
              className="rounded-full bg-[#f4511e] px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618]">
              {revenue ? "Replace" : "Record"}
            </button>
          )}
        </div>

        {context && (
          <p className="mb-3 text-[0.75rem] text-[#8c8f94]">
            Order total {formatMoney(context.order_total, context.order_currency)}
            {context.system_invoice_number && (
              <> · system invoice {context.system_invoice_number} ({formatMoney(context.system_invoice_amount, context.order_currency)})</>
            )}
            {" · "}customer acceptance: {context.customer_acceptance_status ?? "pending"}
          </p>
        )}

        {revenue ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.83rem]">
            <span className="font-semibold text-[#171a20]">{revenue.invoice_number}</span>
            <span className="tabular-nums">{formatMoney(revenue.amount, revenue.currency)}</span>
            {revenue.issued_on && <span className="text-[#5c5e62]">issued {revenue.issued_on}</span>}
            {revenue.customer_agreed_at ? (
              <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 size={12} /> customer agreed</span>
            ) : (
              <span className="text-amber-600">agreement not confirmed</span>
            )}
            {revenue.variance_from_order_total != null && revenue.variance_from_order_total !== 0 && (
              <span className={revenue.variance_from_order_total > 0 ? "text-emerald-700" : "text-amber-700"}>
                {revenue.variance_from_order_total > 0 ? "+" : ""}
                {formatMoney(revenue.variance_from_order_total, revenue.currency)} vs order total
              </span>
            )}
            {revenue.has_file ? (
              <a href={`/api/admin/orders/${orderId}/profitability/revenue/download`}
                className="flex items-center gap-1 font-semibold text-[#171a20] underline-offset-2 hover:underline">
                <Download size={12} /> {revenue.file_name ?? "PDF"}
              </a>
            ) : (
              <span className="flex items-center gap-1 text-[#8c8f94]"><FileText size={12} /> no PDF attached</span>
            )}
            {revenue.set_by && <span className="text-[0.72rem] text-[#8c8f94]">recorded by {revenue.set_by}</span>}
          </div>
        ) : !revenueFormOpen ? (
          <p className="text-[0.83rem] text-[#8c8f94]">
            No revenue invoice recorded yet — the finalized invoice the customer agreed to goes here.
          </p>
        ) : null}

        {revenueFormOpen && (
          <RevenueForm
            orderId={orderId}
            defaults={{
              invoice_number: revenue?.invoice_number ?? context?.system_invoice_number ?? "",
              amount: revenue?.amount ?? context?.system_invoice_amount ?? context?.order_total ?? 0,
              currency: revenue?.currency ?? context?.order_currency ?? "EUR",
            }}
            onCancel={() => setRevenueFormOpen(false)}
            onDone={(message) => {
              setRevenueFormOpen(false);
              if (message) setNotice(message);
              void load();
            }}
          />
        )}
      </div>

      {/* ── Costs ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/[0.06]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#f4511e]">
            Supplier invoices &amp; fees
          </p>
          {canManage && !costFormOpen && (
            <button type="button" onClick={() => setCostFormOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618]">
              <Plus size={13} /> Add cost
            </button>
          )}
        </div>

        {costFormOpen && (
          <CostForm
            orderId={orderId}
            onCancel={() => setCostFormOpen(false)}
            onDone={(message) => {
              setCostFormOpen(false);
              if (message) setNotice(message);
              void load();
            }}
          />
        )}

        {lines.length === 0 ? (
          !costFormOpen && (
            <p className="text-[0.83rem] text-[#8c8f94]">
              No costs recorded yet — supplier invoices and channel fees (Stripe, eBay, bank) go here.
            </p>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                  <th className={TH}>Type</th>
                  <th className={TH}>Supplier / reference</th>
                  <th className={TH}>Amount</th>
                  <th className={TH}>Date</th>
                  <th className={TH}>Document</th>
                  {canManage && <th className={TH} />}
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b border-black/[0.04] last:border-0">
                    <td className={TD}>
                      {line.kind === "fee" ? (
                        <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[0.7rem] font-bold uppercase text-[#5c5e62]">
                          {FEE_LABEL[line.category ?? "other"] ?? line.category} fee
                        </span>
                      ) : (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[0.7rem] font-bold uppercase text-blue-700">
                          Supplier
                        </span>
                      )}
                    </td>
                    <td className={TD}>
                      {line.supplier ?? "—"}
                      {line.reference && <span className="ml-1.5 text-[0.72rem] text-[#8c8f94]">{line.reference}</span>}
                      {line.notes && <p className="text-[0.7rem] text-[#8c8f94]">{line.notes}</p>}
                    </td>
                    <td className={`${TD} tabular-nums font-semibold`}>{formatMoney(line.amount, line.currency)}</td>
                    <td className={`${TD} whitespace-nowrap text-[#5c5e62]`}>{line.incurred_on ?? "—"}</td>
                    <td className={TD}>
                      {line.has_file ? (
                        <a href={`/api/admin/orders/${orderId}/profitability/costs/${line.id}/download`}
                          className="flex items-center gap-1 text-[0.75rem] font-semibold underline-offset-2 hover:underline">
                          <Download size={11} /> Download
                        </a>
                      ) : (
                        <span className="text-[0.75rem] text-[#8c8f94]">—</span>
                      )}
                    </td>
                    {canManage && (
                      <td className={`${TD} text-right`}>
                        <button type="button" onClick={() => void removeCost(line)}
                          className="text-[#8c8f94] transition hover:text-red-600" aria-label="Remove cost">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#fafafa] text-[0.78rem] font-semibold">
                  <td className={TD} colSpan={2}>
                    Suppliers {formatMoney(costs.supplier_total, costs.currency)} · fees {formatMoney(costs.fees_total, costs.currency)}
                  </td>
                  <td className={`${TD} tabular-nums`}>{formatMoney(costs.total, costs.currency)}</td>
                  <td colSpan={canManage ? 3 : 2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Forms ─────────────────────────────────────────────────────────────────────

function RevenueForm({
  orderId, defaults, onCancel, onDone,
}: {
  orderId: number;
  defaults: { invoice_number: string; amount: number | null; currency: string };
  onCancel: () => void;
  onDone: (message: string | null) => void;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState(defaults.invoice_number);
  const [amount, setAmount] = useState(defaults.amount == null ? "" : String(defaults.amount));
  const [currency, setCurrency] = useState(defaults.currency);
  const [issuedOn, setIssuedOn] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const fd = new FormData();
      fd.append("invoice_number", invoiceNumber);
      fd.append("amount", amount);
      fd.append("currency", currency);
      if (issuedOn) fd.append("issued_on", issuedOn);
      fd.append("customer_agreed", agreed ? "1" : "0");
      if (file) fd.append("file", file);
      const res = await fetch(`/api/admin/orders/${orderId}/profitability/revenue`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.errors) setFieldErrors(json.errors);
        setFormError(json.message ?? "Could not record the revenue invoice.");
        return;
      }
      // A 201 that still carries a warning means the record saved and the
      // file did not — not a plain success, so not shown as one.
      onDone(json.message && !String(json.message).endsWith("recorded.") ? String(json.message) : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl bg-[#f8f9fa] p-4">
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] text-red-700">{formError}</p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className={LABEL}>Invoice number</label>
          <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required maxLength={50} className={INPUT} />
          {fieldErrors.invoice_number && <p className="mt-1 text-[0.7rem] text-red-600">{fieldErrors.invoice_number[0]}</p>}
        </div>
        <div>
          <label className={LABEL}>Amount</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required className={INPUT} />
          {fieldErrors.amount && <p className="mt-1 text-[0.7rem] text-red-600">{fieldErrors.amount[0]}</p>}
        </div>
        <div>
          <label className={LABEL}>Currency</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Issued on</label>
          <input type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} className={INPUT} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-[0.8rem] text-[#171a20]">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-[#f4511e]" />
          The customer agreed to this invoice
        </label>
        <label className="text-[0.8rem] text-[#5c5e62]">
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-[0.75rem] file:mr-2 file:rounded-full file:border-0 file:bg-[#171a20] file:px-3 file:py-1 file:text-[0.72rem] file:font-semibold file:text-white" />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-50">
          {busy && <Loader2 size={12} className="animate-spin" />} Save revenue invoice
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full bg-white px-4 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] ring-1 ring-black/[0.08]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function CostForm({
  orderId, onCancel, onDone,
}: {
  orderId: number;
  onCancel: () => void;
  onDone: (message: string | null) => void;
}) {
  const [kind, setKind] = useState<"supplier_invoice" | "fee">("supplier_invoice");
  const [category, setCategory] = useState<string>("stripe");
  const [supplier, setSupplier] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [incurredOn, setIncurredOn] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      if (kind === "fee") fd.append("category", category);
      if (supplier) fd.append("supplier", supplier);
      if (reference) fd.append("reference", reference);
      fd.append("amount", amount);
      fd.append("currency", currency);
      if (incurredOn) fd.append("incurred_on", incurredOn);
      if (notes) fd.append("notes", notes);
      if (file) fd.append("file", file);
      const res = await fetch(`/api/admin/orders/${orderId}/profitability/costs`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.errors) setFieldErrors(json.errors);
        setFormError(json.message ?? "Could not record the cost.");
        return;
      }
      onDone(json.message && !String(json.message).endsWith("recorded.") ? String(json.message) : null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-xl bg-[#f8f9fa] p-4">
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] text-red-700">{formError}</p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className={LABEL}>Type</label>
          <select value={kind} onChange={(e) => setKind(e.target.value as "supplier_invoice" | "fee")} className={INPUT}>
            <option value="supplier_invoice">Supplier invoice</option>
            <option value="fee">Fee</option>
          </select>
        </div>
        {kind === "fee" ? (
          <div>
            <label className={LABEL}>Fee category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT}>
              {FEE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{FEE_LABEL[c]}</option>
              ))}
            </select>
            {fieldErrors.category && <p className="mt-1 text-[0.7rem] text-red-600">{fieldErrors.category[0]}</p>}
          </div>
        ) : (
          <div>
            <label className={LABEL}>Supplier</label>
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} maxLength={150} className={INPUT} />
            {fieldErrors.supplier && <p className="mt-1 text-[0.7rem] text-red-600">{fieldErrors.supplier[0]}</p>}
          </div>
        )}
        <div>
          <label className={LABEL}>Amount</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required className={INPUT} />
          {fieldErrors.amount && <p className="mt-1 text-[0.7rem] text-red-600">{fieldErrors.amount[0]}</p>}
        </div>
        <div>
          <label className={LABEL}>Currency</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Their invoice no.</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={60} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Date</label>
          <input type="date" value={incurredOn} onChange={(e) => setIncurredOn(e.target.value)} className={INPUT} />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} className={INPUT} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-[0.8rem] text-[#5c5e62]">
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-[0.75rem] file:mr-2 file:rounded-full file:border-0 file:bg-[#171a20] file:px-3 file:py-1 file:text-[0.72rem] file:font-semibold file:text-white" />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-50">
          {busy && <Loader2 size={12} className="animate-spin" />} Save cost
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full bg-white px-4 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] ring-1 ring-black/[0.08]">
          Cancel
        </button>
      </div>
    </form>
  );
}
