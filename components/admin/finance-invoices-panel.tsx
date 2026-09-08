"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus, Loader2, X, Trash2, Pencil, AlertTriangle, Link2Off, Scale, CheckCircle2,
  Paperclip, Download, Lock, FileWarning,
} from "lucide-react";
import type { FinanceInvoice, InvoiceReconciliation } from "@/lib/admin-api";
import { formatMoney } from "@/lib/currency";
import { canDo } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

/**
 * What sevDesk raised, typed in by finance, against what this system issued.
 *
 * Deliberately not an integration: an integration that silently stopped syncing
 * would make the two columns agree by accident, which is the one failure this
 * whole board exists to catch. So the second column is somebody's typing, and
 * the disagreement between the two is the product.
 */

const INPUT =
  "h-9 w-full rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none";
const LABEL = "mb-1 block text-[0.75rem] font-semibold text-[#5c5e62]";

type Tab = "invoices" | "reconciliation";

/**
 * Both sides of the comparison now live in one table, so which side a row is on
 * has to be legible at a glance. `okelcor` is deliberately labelled "Ours" — the
 * point of the register is that these are the two things being compared, and
 * "Okelcor" beside "sevDesk" reads as two vendors rather than as us and them.
 */
const SYSTEM_LABEL: Record<string, string> = {
  sevdesk: "sevDesk",
  okelcor: "Ours",
  upload:  "Uploaded",
  other:   "Other",
};

const systemLabel = (v?: string | null) =>
  (v && SYSTEM_LABEL[v]) ?? (v ? v.replace(/_/g, " ") : "—");

/** Falls back only if the server didn't say — never overrides what it did say. */
const FALLBACK_MANUAL_SYSTEMS = ["sevdesk", "upload", "other"];

function Counts({ rec }: { rec: InvoiceReconciliation }) {
  const c = rec.counts;
  const tiles: { label: string; value: number; tone?: "warn" | "bad" }[] = [
    { label: "Our invoices", value: c.website_invoices },
    { label: "Finance invoices", value: c.finance_invoices },
    { label: "Matched", value: c.matched },
    { label: "Only here", value: c.only_here, tone: c.only_here > 0 ? "warn" : undefined },
    { label: "Only in finance", value: c.only_in_finance, tone: c.only_in_finance > 0 ? "warn" : undefined },
    // Two systems holding the same invoice at different money is a worse
    // finding than one holding it alone, and it is invisible from the board.
    { label: "Amount mismatch", value: c.amount_mismatch, tone: c.amount_mismatch > 0 ? "bad" : undefined },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((t) => (
        <div
          key={t.label}
          className={`rounded-xl border p-3 ${
            t.tone === "bad" ? "border-red-200 bg-red-50"
              : t.tone === "warn" ? "border-amber-200 bg-amber-50"
              : "border-black/[0.06] bg-white"
          }`}
        >
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-[#5c5e62]">{t.label}</p>
          <p className={`mt-0.5 text-[1.15rem] font-bold tabular-nums ${
            t.tone === "bad" ? "text-red-700" : t.tone === "warn" ? "text-amber-800" : "text-[#171a20]"
          }`}>
            {t.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function Reconciliation({ from, to, channel }: { from: string; to: string; channel: string }) {
  const [rec, setRec] = useState<InvoiceReconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (from) p.set("from", from);
        if (to) p.set("to", to);
        if (channel && channel !== "all") p.set("channel", channel);
        const res = await fetch(`/api/admin/operations/invoice-reconciliation?${p}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError(json?.message ?? json?.error ?? "Could not load the reconciliation.");
          setRec(null);
        } else {
          setRec((json?.data ?? null) as InvoiceReconciliation | null);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [from, to, channel]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-8 text-[0.83rem] text-[#5c5e62]">
        <Loader2 size={14} className="animate-spin" /> Comparing the two systems…
      </div>
    );
  }

  if (error || !rec) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
        {error ?? "No reconciliation available."}
      </div>
    );
  }

  if (rec.available === false) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
        <p className="font-semibold">Finance invoice recording isn&apos;t switched on yet.</p>
        <p className="mt-0.5">{rec.reason ?? "There is nothing to compare against until it is."}</p>
      </div>
    );
  }

  const section = "rounded-xl border border-black/[0.06] bg-white overflow-hidden";
  const th = "px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]";
  const td = "px-3 py-2 text-[0.8rem] text-[#171a20]";

  const mismatched = (rec.matched ?? []).filter((m) => m.amount_matches === false);

  return (
    <div className="space-y-4">
      <Counts rec={rec} />

      {mismatched.length > 0 && (
        <div className={section}>
          <p className="flex items-center gap-1.5 border-b border-black/[0.06] bg-red-50 px-3 py-2 text-[0.8rem] font-bold text-red-800">
            <Scale size={13} /> Same invoice, different money ({mismatched.length})
          </p>
          <table className="w-full">
            <thead><tr className="border-b border-black/[0.06]">
              <th className={th}>Order</th><th className={th}>Ours</th><th className={th}>Finance</th>
              <th className={`${th} text-right`}>Our amount</th><th className={`${th} text-right`}>Finance amount</th>
            </tr></thead>
            <tbody>
              {mismatched.map((m, i) => (
                <tr key={i} className="border-b border-black/[0.04] last:border-0">
                  <td className={`${td} font-mono`}>{m.order_ref ?? "—"}</td>
                  <td className={`${td} font-mono`}>{m.our_invoice ?? "—"}</td>
                  <td className={`${td} font-mono`}>{m.finance_invoice ?? "—"}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatMoney(m.our_amount)}</td>
                  <td className={`${td} text-right font-semibold tabular-nums text-red-700`}>
                    {formatMoney(m.finance_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={section}>
        <p className="border-b border-black/[0.06] bg-[#fafafa] px-3 py-2 text-[0.8rem] font-bold text-[#171a20]">
          Only in this system ({rec.only_here?.length ?? 0})
        </p>
        {(rec.only_here?.length ?? 0) === 0 ? (
          <p className="px-3 py-4 text-[0.8rem] text-[#8c8f94]">Nothing — every invoice we issued has a finance record.</p>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-black/[0.06]">
              <th className={th}>Invoice</th><th className={th}>Order</th><th className={`${th} text-right`}>Amount</th>
            </tr></thead>
            <tbody>
              {rec.only_here!.map((r, i) => (
                <tr key={i} className="border-b border-black/[0.04] last:border-0">
                  <td className={`${td} font-mono`}>{r.invoice_number ?? "—"}</td>
                  <td className={`${td} font-mono`}>{r.order_ref ?? "—"}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatMoney(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={section}>
        <p className="border-b border-black/[0.06] bg-[#fafafa] px-3 py-2 text-[0.8rem] font-bold text-[#171a20]">
          Only in the finance system ({rec.only_in_finance?.length ?? 0})
        </p>
        {(rec.only_in_finance?.length ?? 0) === 0 ? (
          <p className="px-3 py-4 text-[0.8rem] text-[#8c8f94]">Nothing — every finance invoice matches one of ours.</p>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-black/[0.06]">
              <th className={th}>sevDesk number</th><th className={th}>Order</th><th className={`${th} text-right`}>Amount</th>
            </tr></thead>
            <tbody>
              {rec.only_in_finance!.map((r, i) => (
                <tr key={i} className="border-b border-black/[0.04] last:border-0">
                  <td className={`${td} font-mono`}>{r.external_number ?? "—"}</td>
                  <td className={td}>
                    <span className="font-mono">{r.order_ref ?? "—"}</span>
                    {/* An invoice finance cannot match to an order here is
                        exactly the row worth recording, so it is labelled
                        rather than hidden or treated as bad data. */}
                    {r.order_known_here === false && (
                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-bold text-amber-900">
                        <Link2Off size={9} /> not an order here
                      </span>
                    )}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{formatMoney(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Entry form ────────────────────────────────────────────────────────────────

const BLANK = {
  external_number: "", issued_on: "", order_ref: "", invoice_number: "",
  amount: "", currency: "EUR", channel: "", notes: "",
};

function InvoiceForm({
  editing, manualSystems, onDone, onCancel,
}: {
  editing: FinanceInvoice | null;
  manualSystems: string[];
  onDone: (message?: string | null) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(() =>
    editing
      ? {
          external_number: editing.external_number ?? "",
          issued_on: editing.issued_on ?? "",
          order_ref: editing.order_ref ?? "",
          invoice_number: editing.invoice_number ?? "",
          amount: editing.amount != null ? String(editing.amount) : "",
          currency: editing.currency ?? "EUR",
          channel: editing.channel ?? "",
          notes: editing.notes ?? "",
        }
      : BLANK,
  );
  const [system, setSystem] = useState<string>(editing?.system ?? manualSystems[0] ?? "sevdesk");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof BLANK, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const body: Record<string, unknown> = {
      external_number: form.external_number.trim(),
      issued_on: form.issued_on,
    };
    if (form.order_ref.trim())      body.order_ref      = form.order_ref.trim();
    if (form.invoice_number.trim()) body.invoice_number = form.invoice_number.trim();
    if (form.amount.trim())         body.amount         = Number(form.amount);
    if (form.currency)              body.currency       = form.currency;
    if (form.channel)               body.channel        = form.channel;
    if (form.notes.trim())          body.notes          = form.notes.trim();

    body.system = system;

    try {
      // Multipart only when there is a file — finance has the PDF in front of
      // them while typing the number, so attaching it is part of the same act
      // rather than a second step that gets skipped.
      let res: Response;
      if (!editing && file) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(body)) fd.append(k, String(v));
        fd.append("file", file);
        res = await fetch("/api/admin/finance-invoices", { method: "POST", body: fd });
      } else {
        res = await fetch(
          editing ? `/api/admin/finance-invoices/${editing.id}` : "/api/admin/finance-invoices",
          {
            method: editing ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Editing an auto-registered row is refused with an explanation worth
        // showing verbatim: the row follows the document, and deleting it would
        // only mean it comes back next time that invoice is saved.
        if (res.status === 409 && json.code === "auto_registered") {
          setError(json.message ?? "This row is maintained automatically and can't be edited here.");
          return;
        }
        // A duplicate external_number comes back as a 422 on that field, not a
        // database error — it is the one entry that would make the two sides of
        // the board agree when they do not, so it lands on the field itself.
        if (res.status === 422 && json.errors) setFieldErrors(json.errors);
        setError(json.message ?? json.error ?? "Could not save this invoice.");
        return;
      }
      // The record can save while the file fails — a 201 that still carries a
      // message. Passed up rather than swallowed, because "saved" and "saved
      // without the document you attached" are different outcomes.
      onDone(typeof json.message === "string" ? json.message : null);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => fieldErrors[k]?.[0];

  return (
    <form onSubmit={submit} className="rounded-xl border border-black/[0.06] bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-[0.9rem] font-bold text-[#171a20]">
          {editing ? `Edit ${editing.external_number}` : "Record a finance invoice"}
        </h3>
        <button type="button" onClick={onCancel} className="ml-auto text-[#8c8f94] hover:text-[#171a20]">
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={LABEL}>sevDesk number <span className="text-[#f4511e]">*</span></label>
          <input value={form.external_number} onChange={(e) => set("external_number", e.target.value)}
                 required placeholder="SD-114" className={INPUT} />
          {err("external_number") && <p className="mt-1 text-[0.72rem] text-red-600">{err("external_number")}</p>}
        </div>
        <div>
          <label className={LABEL}>Issued on <span className="text-[#f4511e]">*</span></label>
          <input type="date" value={form.issued_on} onChange={(e) => set("issued_on", e.target.value)}
                 required className={INPUT} />
          {err("issued_on") && <p className="mt-1 text-[0.72rem] text-red-600">{err("issued_on")}</p>}
        </div>
        <div>
          <label className={LABEL}>Order ref</label>
          <input value={form.order_ref} onChange={(e) => set("order_ref", e.target.value)}
                 placeholder="OKL-C06OT" className={INPUT} />
          <p className="mt-1 text-[0.68rem] text-[#8c8f94]">Not checked against our orders — record it as it reads.</p>
        </div>
        <div>
          <label className={LABEL}>Our invoice number</label>
          <input value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)}
                 placeholder="INV-2026-0042" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Amount</label>
          <input type="number" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                 className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Currency</label>
          <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={INPUT}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Channel</label>
          <select value={form.channel} onChange={(e) => set("channel", e.target.value)} className={INPUT}>
            <option value="">Infer from order ref</option>
            <option value="normal">Normal</option>
            <option value="ebay">eBay</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Notes</label>
          <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Recorded from</label>
          {/*
            Driven off `meta.manual_systems`, which is exactly the set the server
            accepts. `okelcor` is absent on purpose and rejected with a 422 if
            sent: it would put a number on our side of the comparison that
            nothing on our side actually issued.
          */}
          <select value={system} onChange={(e) => setSystem(e.target.value)} className={INPUT}>
            {manualSystems.map((v) => (
              <option key={v} value={v}>{systemLabel(v)}</option>
            ))}
          </select>
        </div>
      </div>

      {!editing && (
        <div className="mt-3">
          <label className={LABEL}>
            <Paperclip size={11} className="mr-1 inline" />
            The sevDesk document (optional)
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-[0.8rem] text-[#5c5e62] file:mr-3 file:rounded-full file:border-0 file:bg-[#f0f2f5] file:px-3 file:py-1.5 file:text-[0.78rem] file:font-semibold file:text-[#171a20] hover:file:bg-[#e5e7eb]"
          />
          <p className="mt-1 text-[0.68rem] text-[#8c8f94]">
            PDF, JPG or PNG · max 20 MB. Attached in the same step, so there is no second
            one to forget.
          </p>
        </div>
      )}

      {error && Object.keys(fieldErrors).length === 0 && (
        <p className="mt-2 text-[0.78rem] text-red-600">{error}</p>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-[0.83rem] font-semibold text-[#5c5e62]">
          Cancel
        </button>
        <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-[#171a20] px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-black disabled:opacity-50">
          {saving && <Loader2 size={13} className="animate-spin" />}
          {editing ? "Save" : "Record invoice"}
        </button>
      </div>
    </form>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export default function FinanceInvoicesPanel({
  initialTab, from, to, channel,
}: {
  initialTab: Tab;
  from: string;
  to: string;
  channel: string;
}) {
  const { role, permissions } = useAdminPermissions();
  const canManage = canDo(role ?? "", "finance.manage", permissions);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [rows, setRows] = useState<FinanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<FinanceInvoice | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [systems, setSystems] = useState<string[]>([]);
  const [manualSystems, setManualSystems] = useState<string[]>(FALLBACK_MANUAL_SYSTEMS);
  const [system, setSystem] = useState<string>("all");
  const [hasFile, setHasFile] = useState<string>("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ per_page: "50" });
      if (from) p.set("from", from);
      if (to) p.set("to", to);
      if (channel && channel !== "all") p.set("channel", channel);
      if (system !== "all") p.set("system", system);
      if (hasFile !== "all") p.set("has_file", hasFile);
      const res = await fetch(`/api/admin/finance-invoices?${p}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUnavailable(json.message ?? json.error ?? "Finance invoices aren't available on this server yet.");
        setRows([]);
      } else {
        setUnavailable(null);
        setRows(Array.isArray(json.data) ? json.data : []);
        // Both lists are served. Driving the tabs and the create dropdown off
        // them means a system added server-side needs no frontend deploy.
        const m = json.meta ?? {};
        if (Array.isArray(m.systems)) setSystems(m.systems as string[]);
        if (Array.isArray(m.manual_systems) && m.manual_systems.length > 0) {
          setManualSystems(m.manual_systems as string[]);
        }
      }
    } catch {
      setUnavailable("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [from, to, channel, system, hasFile]);

  useEffect(() => { void load(); }, [load]);

  async function remove(id: number) {
    setDeleting(id);
    setRowError(null);
    try {
      const res = await fetch(`/api/admin/finance-invoices/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        // Shown verbatim: the message explains that the row follows the
        // document, which is the part that stops someone trying again.
        setRowError(
          json.message
            ?? (res.status === 409
              ? "This row is maintained automatically and can't be deleted here."
              : "Could not delete this invoice."),
        );
        return;
      }
      await load();
    } finally {
      setDeleting(null);
    }
  }

  /** Attach or replace the document on an existing row. */
  async function attach(id: number, f: File) {
    setAttaching(id);
    setRowError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(`/api/admin/finance-invoices/${id}/file`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRowError(json.message ?? "Could not attach that file.");
        return;
      }
      await load();
    } finally {
      setAttaching(null);
    }
  }

  const tabBtn = (t: Tab) =>
    `rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold transition ${
      tab === t ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
    }`;

  const th = "px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]";
  const td = "px-3 py-2 text-[0.8rem] text-[#171a20]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTab("invoices")} className={tabBtn("invoices")}>
          Recorded invoices
        </button>
        <button type="button" onClick={() => setTab("reconciliation")} className={tabBtn("reconciliation")}>
          Reconciliation
        </button>
        {tab === "invoices" && canManage && !adding && !editing && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-[#f4511e] px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition hover:bg-[#d24f13]"
          >
            <Plus size={13} /> Record an invoice
          </button>
        )}
      </div>

      {tab === "reconciliation" ? (
        <Reconciliation from={from} to={to} channel={channel} />
      ) : (
        <>
          {/*
            The two sides of the comparison, split.
            Mixing finance's entries and our own in one table is how you stop
            being able to see the comparison the register exists to make.
          */}
          {systems.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button" onClick={() => setSystem("all")}
                className={`rounded-full px-3 py-1 text-[0.78rem] font-semibold transition ${
                  system === "all" ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
                }`}
              >
                All
              </button>
              {systems.map((sys) => (
                <button
                  key={sys} type="button" onClick={() => setSystem(sys)}
                  className={`rounded-full px-3 py-1 text-[0.78rem] font-semibold transition ${
                    system === sys ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
                  }`}
                >
                  {systemLabel(sys)}
                </button>
              ))}

            </div>
          )}

          {/* Finance's work queue — independent of the system tabs, so it is
              still reachable on a server that doesn't serve `meta.systems`. */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setHasFile((v) => (v === "no" ? "all" : "no"))}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.78rem] font-semibold transition ${
                hasFile === "no"
                  ? "bg-amber-100 text-amber-900"
                  : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]"
              }`}
            >
              <FileWarning size={12} /> Missing document
            </button>
            {hasFile === "no" && (
              <span className="text-[0.72rem] text-[#8c8f94]">
                Rows with no sevDesk document attached.
              </span>
            )}
          </div>

          {notice && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[0.8rem] text-amber-900">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <p className="flex-1">{notice}</p>
              <button type="button" onClick={() => setNotice(null)} className="shrink-0 opacity-70 hover:opacity-100">
                <X size={13} />
              </button>
            </div>
          )}

          {rowError && (
            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[0.8rem] text-slate-700">
              <Lock size={14} className="mt-0.5 shrink-0" />
              <p className="flex-1">{rowError}</p>
              <button type="button" onClick={() => setRowError(null)} className="shrink-0 opacity-70 hover:opacity-100">
                <X size={13} />
              </button>
            </div>
          )}

          {(adding || editing) && (
            <InvoiceForm
              editing={editing}
              manualSystems={manualSystems}
              onCancel={() => { setAdding(false); setEditing(null); }}
              onDone={(message) => {
                setAdding(false); setEditing(null);
                // A 201 that still carries a message means the record saved and
                // the file did not. Not a plain success, so not shown as one.
                if (message) setNotice(message);
                void load();
              }}
            />
          )}

          {unavailable ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
              <p className="font-semibold">Not available on this server yet.</p>
              <p className="mt-0.5">{unavailable}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white p-8 text-[0.83rem] text-[#5c5e62]">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-black/[0.06] bg-white p-8 text-center text-[0.83rem] text-[#8c8f94]">
              {system !== "all" || hasFile !== "all"
                ? "Nothing matches these filters in this period."
                : "Nothing recorded for this period yet."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                      <th className={th}>sevDesk number</th>
                      <th className={th}>Issued</th>
                      <th className={th}>Order</th>
                      <th className={th}>Our invoice</th>
                      <th className={`${th} text-right`}>Amount</th>
                      <th className={th}>Channel</th>
                      <th className={th}>Recorded from</th>
                      <th className={th}>Document</th>
                      <th className={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-black/[0.04] last:border-0">
                        <td className={`${td} font-mono font-semibold`}>{r.external_number}</td>
                        <td className={td}>{r.issued_on}</td>
                        <td className={td}>
                          <span className="font-mono">{r.order_ref ?? "—"}</span>
                          {r.order_known_here === false && r.order_ref && (
                            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.65rem] font-bold text-amber-900">
                              <Link2Off size={9} /> not an order here
                            </span>
                          )}
                          {r.matched === true && (
                            <span className="ml-1.5 inline-flex items-center gap-1 text-[0.65rem] font-bold text-emerald-700">
                              <CheckCircle2 size={9} /> matched
                            </span>
                          )}
                        </td>
                        <td className={`${td} font-mono`}>{r.invoice_number ?? "—"}</td>
                        <td className={`${td} text-right tabular-nums`}>{formatMoney(r.amount, r.currency)}</td>
                        <td className={`${td} capitalize`}>{r.channel ?? "—"}</td>
                        <td className={td}>
                          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                            r.system === "okelcor"
                              ? "bg-[#fff0e8] text-[#7c3a15]"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {systemLabel(r.system)}
                          </span>
                          {/* Written by the system, following the document. */}
                          {r.auto_registered && (
                            <span
                              title="Maintained automatically from the invoice this system issued."
                              className="ml-1 inline-flex items-center gap-1 text-[0.62rem] font-bold text-[#8c8f94]"
                            >
                              <Lock size={8} /> auto
                            </span>
                          )}
                        </td>
                        <td className={td}>
                          {r.has_file ? (
                            <a
                              href={`/api/admin/finance-invoices/${r.id}/download`}
                              title={r.file_name ?? "Download"}
                              className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#f4511e] hover:underline"
                            >
                              <Download size={11} /> Download
                            </a>
                          ) : canManage && !r.auto_registered ? (
                            <label className="inline-flex cursor-pointer items-center gap-1 text-[0.75rem] font-semibold text-[#5c5e62] hover:text-[#171a20]">
                              {attaching === r.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <Paperclip size={11} />}
                              Attach
                              <input
                                type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void attach(r.id, f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          ) : (
                            // No download button when there is nothing attached:
                            // the endpoint 404s, and a button that always fails
                            // teaches people to distrust the ones that work.
                            <span className="text-[0.75rem] text-[#c9cdd1]">—</span>
                          )}
                        </td>
                        <td className={`${td} text-right`}>
                          {canManage && (
                            r.auto_registered ? (
                              // Read-only. PATCH and DELETE both 409 here, so the
                              // controls are absent rather than present-and-failing.
                              <span
                                title="This row follows the invoice this system issued. Deleting it would only mean it reappears next time that invoice is saved."
                                className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-[#8c8f94]"
                              >
                                <Lock size={10} /> Automatic
                              </span>
                            ) : (
                              <div className="flex justify-end gap-0.5">
                                <button type="button" onClick={() => { setEditing(r); setAdding(false); }}
                                        title="Edit"
                                        className="rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20]">
                                  <Pencil size={13} />
                                </button>
                                <button type="button" onClick={() => remove(r.id)} disabled={deleting === r.id}
                                        title="Delete"
                                        className="rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                                  {deleting === r.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                </button>
                              </div>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <p className="flex items-start gap-1.5 text-[0.72rem] leading-snug text-[#8c8f94]">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            This is typed in from sevDesk on purpose rather than synced. An integration that
            quietly stopped working would make both columns agree, which is the one failure the
            board exists to catch.
          </p>
        </>
      )}
    </div>
  );
}
