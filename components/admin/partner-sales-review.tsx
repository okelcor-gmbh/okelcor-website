"use client";

/**
 * components/admin/partner-sales-review.tsx
 *
 * The screen the whole system was built for: head office could not get numbers
 * out of paper reports, and reviewing them took too long.
 *
 * Two things matter more than the table itself:
 *
 *   1. **Totals per currency, never combined.** Partners sell in GHS, NGN, KES,
 *      AED and more, and nothing converts. A single summed figure would be
 *      meaningless while looking authoritative — the worst combination in a
 *      bookkeeping tool.
 *   2. **The export.** A month of clean CSV is what finance actually needs;
 *      the table is for spot-checking and verifying.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, CheckCircle2, AlertTriangle, Filter } from "lucide-react";
import type { PartnerOrganisation, PartnerSaleRecord, PartnerSalesTotals } from "@/lib/admin-api";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

const FIELD =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-[0.85rem] outline-none transition focus:border-[#f4511e]/50 focus:ring-2 focus:ring-[#f4511e]/10";

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-DE", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** First and last day of the current month, the default review window. */
function defaultRange() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const first = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const last = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return { first, last };
}

export default function PartnerSalesReview() {
  const { first, last } = useMemo(defaultRange, []);

  const [rows, setRows] = useState<PartnerSaleRecord[] | null>(null);
  const [totals, setTotals] = useState<PartnerSalesTotals>([]);
  const [partners, setPartners] = useState<PartnerOrganisation[]>([]);

  const [partner, setPartner] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(last);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [disputing, setDisputing] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  // Gate on can(), never on the role string — see hooks/use-admin-permissions.
  const { can } = useAdminPermissions();
  const canVerify = can("partner_sales.verify");
  const canExport = can("partner_sales.export");

  const query = useMemo(() => {
    const q = new URLSearchParams();
    if (partner) q.set("partner", partner);
    if (status) q.set("status", status);
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return q.toString();
  }, [partner, status, from, to]);

  const load = useCallback(async () => {
    try {
      const [listRes, totalRes] = await Promise.all([
        fetch(`/api/admin/partner-sales?${query}`, { cache: "no-store" }),
        fetch(`/api/admin/partner-sales/totals?${query}`, { cache: "no-store" }),
      ]);

      // The endpoints 500 until migration #28 is applied — say so plainly
      // rather than showing an empty table that looks like "no sales".
      if (listRes.status >= 500) {
        setUnavailable(true);
        setRows([]);
        return;
      }
      setUnavailable(false);

      const list = await listRes.json().catch(() => ({}));
      const tot = await totalRes.json().catch(() => ({}));
      setRows(Array.isArray(list.data) ? list.data : []);
      setTotals(Array.isArray(tot.data) ? tot.data : []);
    } catch {
      setUnavailable(true);
      setRows([]);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/partners", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        setPartners(Array.isArray(json.data) ? json.data : []);
      } catch {
        setPartners([]);
      }
    })();
  }, []);

  async function verify(id: number) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/partner-sales/${id}/verify`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function dispute(id: number) {
    if (!note.trim()) return;
    setBusyId(id);
    try {
      await fetch(`/api/admin/partner-sales/${id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      setDisputing(null);
      setNote("");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="f-partner" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">Partner</label>
          <select id="f-partner" value={partner} onChange={(e) => setPartner(e.target.value)} className={FIELD}>
            <option value="">All partners</option>
            {partners.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-status" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">Status</label>
          <select id="f-status" value={status} onChange={(e) => setStatus(e.target.value)} className={FIELD}>
            <option value="">All</option>
            <option value="submitted">Needs review</option>
            <option value="verified">Verified</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
        <div>
          <label htmlFor="f-from" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">From</label>
          <input id="f-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${FIELD} tabular-nums`} />
        </div>
        <div>
          <label htmlFor="f-to" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">To</label>
          <input id="f-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${FIELD} tabular-nums`} />
        </div>

        {canExport && (
          <a
            href={`/api/admin/partner-sales/export?${query}`}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#f4511e] px-4 py-2 text-[0.85rem] font-semibold text-white transition hover:bg-[#df4618]"
          >
            <Download size={15} /> Export CSV
          </a>
        )}
      </div>

      {unavailable && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[0.85rem] text-amber-800">
          <strong>Partner sales are not available yet.</strong> The API is not
          responding — usually because migration #28 has not been applied on the
          backend. Nothing is lost: partners&apos; entries stay queued on their phones
          until this is reachable.
        </div>
      )}

      {/* Totals — per currency, never combined */}
      {totals.length > 0 && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {totals.map((t) => (
            <div key={t.currency} className="rounded-xl border border-black/[0.06] bg-white p-4">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">{t.currency}</p>
              <p className="mt-1 text-[1.4rem] font-extrabold tabular-nums text-[#1a1a1a]">
                {money(t.total, t.currency)}
              </p>
              <p className="mt-0.5 text-[0.78rem] tabular-nums text-[#5c5e62]">
                {t.pieces} pcs · {t.entries} entries
              </p>
            </div>
          ))}
          <p className="col-span-full -mt-1 text-[0.72rem] text-[#9ca3af]">
            Totals are shown per currency and never added together — nothing is converted,
            so a combined figure would not mean anything.
          </p>
        </div>
      )}

      {/* Table */}
      {rows === null ? (
        <p className="py-8 text-center text-[0.9rem] text-[#5c5e62]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-black/[0.06] bg-white py-12 text-center">
          <Filter size={26} className="mx-auto text-[#9ca3af]" strokeWidth={1.6} />
          <p className="mt-3 text-[0.95rem] font-semibold text-[#1a1a1a]">No sales in this range</p>
          <p className="mt-1 text-[0.85rem] text-[#5c5e62]">Try a wider date range or a different partner.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/[0.06] bg-white">
          <table className="w-full min-w-[820px] text-left text-[0.85rem]">
            <thead className="border-b border-black/[0.06] text-[0.72rem] uppercase tracking-[0.1em] text-[#9ca3af]">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Partner</th>
                <th className="px-4 py-3 font-semibold">Tyre</th>
                <th className="px-4 py-3 text-right font-semibold">Qty</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                {canVerify && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {rows.map((r) => (
                <tr key={r.id} className={r.deleted ? "opacity-50" : ""}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono tabular-nums text-[#5c5e62]">{r.sold_at}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1a1a1a]">{r.partner_name ?? `#${r.partner_org_id}`}</p>
                    {r.entered_by && <p className="text-[0.75rem] text-[#9ca3af]">by {r.entered_by}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono font-semibold text-[#1a1a1a]">{r.size}</p>
                    <p className="text-[0.75rem] text-[#5c5e62]">
                      {r.tyre_type?.toUpperCase()}{r.brand ? ` · ${r.brand}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{r.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-[#1a1a1a]">
                    {money(Number(r.total_amount ?? r.quantity * r.unit_price), r.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.deleted ? "deleted" : r.status} />
                  </td>
                  {canVerify && (
                    <td className="px-4 py-3">
                      {!r.deleted && r.status !== "verified" && (
                        <div className="flex justify-end gap-1.5">
                          <button type="button" disabled={busyId === r.id} onClick={() => verify(r.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[0.75rem] font-semibold text-emerald-700 disabled:opacity-40">
                            <CheckCircle2 size={12} /> Verify
                          </button>
                          <button type="button" disabled={busyId === r.id}
                            onClick={() => { setDisputing(disputing === r.id ? null : r.id); setNote(""); }}
                            className="inline-flex items-center gap-1 rounded-md border border-black/10 px-2.5 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] disabled:opacity-40">
                            <AlertTriangle size={12} /> Dispute
                          </button>
                        </div>
                      )}
                      {disputing === r.id && (
                        <div className="mt-2 flex gap-2">
                          <input value={note} onChange={(e) => setNote(e.target.value)} autoFocus
                            placeholder="What is wrong with this entry?" className={`${FIELD} flex-1`} />
                          <button type="button" disabled={!note.trim() || busyId === r.id} onClick={() => dispute(r.id)}
                            className="rounded-md bg-[#f4511e] px-3 py-1.5 text-[0.75rem] font-semibold text-white disabled:opacity-40">
                            Send
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string, string]> = {
    submitted: ["Needs review", "bg-amber-50", "text-amber-700"],
    verified: ["Verified", "bg-emerald-50", "text-emerald-700"],
    disputed: ["Disputed", "bg-red-50", "text-red-600"],
    deleted: ["Deleted", "bg-slate-100", "text-slate-500"],
  };
  const [label, bg, fg] = map[status] ?? [status, "bg-slate-100", "text-slate-500"];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${bg} ${fg}`}>{label}</span>
  );
}
