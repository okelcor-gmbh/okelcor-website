"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { LiquidityWeekRow } from "@/lib/admin-api";
import { formatMoney } from "@/lib/currency";
import { canDo } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

/**
 * The liquidity ladder: four ISO weeks starting at the current one, each
 * holding the bank balance and expected movements finance maintains.
 *
 * The window rolls by the CALENDAR — when a week ends it disappears from this
 * view on the next load and the next week enters; nothing here manages that,
 * and a finished week's data survives under History below. `projected_closing`
 * chains week to week server-side: a week opens on its entered balance, or on
 * the previous week's projected close where none is entered.
 */

type Draft = { bank_balance: string; expected_in: string; expected_out: string; notes: string };

const INPUT =
  "h-9 w-full rounded-lg border border-black/[0.10] bg-white px-3 text-right text-[0.83rem] tabular-nums text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none disabled:bg-[#f8f9fa] disabled:text-[#8c8f94]";
const LABEL = "mb-1 block text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]";

function toDraft(w: LiquidityWeekRow): Draft {
  return {
    bank_balance: w.bank_balance == null ? "" : String(w.bank_balance),
    expected_in:  w.expected_in == null ? "" : String(w.expected_in),
    expected_out: w.expected_out == null ? "" : String(w.expected_out),
    notes:        w.notes ?? "",
  };
}

export default function LiquidityLadder() {
  const { role, permissions } = useAdminPermissions();
  const canManage = canDo(role ?? "", "finance.manage", permissions);

  const [weeks, setWeeks] = useState<LiquidityWeekRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<LiquidityWeekRow[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance/liquidity");
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.meta?.liquidity_available === false) {
        setUnavailable(json.message ?? json.error ?? "Liquidity planning isn't available on this server yet.");
        setWeeks([]);
      } else {
        setUnavailable(null);
        const rows: LiquidityWeekRow[] = Array.isArray(json?.data?.weeks) ? json.data.weeks : [];
        setWeeks(rows);
        setDrafts(Object.fromEntries(rows.map((w) => [w.week_key, toDraft(w)])));
      }
    } catch {
      setUnavailable("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function save(weekKey: string) {
    const d = drafts[weekKey];
    if (!d) return;
    setSaving(weekKey);
    setError(null);
    setSaved(null);
    try {
      // Empty string = "not entered": sent as null so it clears, which is
      // different from zero — a bank balance of 0 is a fact, not an absence.
      const res = await fetch(`/api/admin/finance/liquidity/${weekKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank_balance: d.bank_balance === "" ? null : Number(d.bank_balance),
          expected_in:  d.expected_in === "" ? null : Number(d.expected_in),
          expected_out: d.expected_out === "" ? null : Number(d.expected_out),
          notes:        d.notes === "" ? null : d.notes,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? json.error ?? "Could not save this week.");
        return;
      }
      setSaved(weekKey);
      setTimeout(() => setSaved(null), 2500);
      await load(); // the projection chains, so every later week may move
    } finally {
      setSaving(null);
    }
  }

  async function loadHistory() {
    setHistoryOpen((o) => !o);
    if (history !== null) return;
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/admin/finance/liquidity/history?weeks=26");
      const json = await res.json().catch(() => ({}));
      setHistory(Array.isArray(json?.data?.weeks) ? json.data.weeks : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  if (loading) {
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[0.83rem] text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {weeks.map((w) => {
          const d = drafts[w.week_key] ?? toDraft(w);
          const closing = w.projected_closing;
          return (
            <div
              key={w.week_key}
              className={`rounded-xl border bg-white p-4 ${
                w.is_current ? "border-[#f4511e]/40 ring-1 ring-[#f4511e]/20" : "border-black/[0.06]"
              }`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-[0.85rem] font-bold text-[#171a20]">{w.label}</p>
                  <p className="text-[0.7rem] text-[#8c8f94]">{w.starts_on} → {w.ends_on}</p>
                </div>
                {w.is_current && (
                  <span className="rounded-full bg-[#f4511e]/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-[#f4511e]">
                    This week
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className={LABEL}>Bank balance</label>
                  <input
                    type="number" step="0.01" inputMode="decimal" disabled={!canManage}
                    value={d.bank_balance} placeholder="not entered"
                    onChange={(e) => setDrafts((p) => ({ ...p, [w.week_key]: { ...d, bank_balance: e.target.value } }))}
                    className={INPUT}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL}>Expected in</label>
                    <input
                      type="number" step="0.01" min="0" inputMode="decimal" disabled={!canManage}
                      value={d.expected_in} placeholder="—"
                      onChange={(e) => setDrafts((p) => ({ ...p, [w.week_key]: { ...d, expected_in: e.target.value } }))}
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Expected out</label>
                    <input
                      type="number" step="0.01" min="0" inputMode="decimal" disabled={!canManage}
                      value={d.expected_out} placeholder="—"
                      onChange={(e) => setDrafts((p) => ({ ...p, [w.week_key]: { ...d, expected_out: e.target.value } }))}
                      className={INPUT}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Notes</label>
                  <input
                    type="text" maxLength={1000} disabled={!canManage}
                    value={d.notes} placeholder="—"
                    onChange={(e) => setDrafts((p) => ({ ...p, [w.week_key]: { ...d, notes: e.target.value } }))}
                    className={`${INPUT} text-left`}
                  />
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-[#f8f9fa] px-3 py-2">
                <p className="text-[0.62rem] font-bold uppercase tracking-wider text-[#8c8f94]">Projected closing</p>
                <p className={`text-[1.05rem] font-bold tabular-nums ${
                  closing == null ? "text-[#8c8f94]" : closing >= 0 ? "text-emerald-700" : "text-red-600"
                }`}>
                  {closing == null ? "—" : formatMoney(closing, "EUR")}
                </p>
              </div>

              {canManage && (
                <button
                  type="button"
                  onClick={() => void save(w.week_key)}
                  disabled={saving === w.week_key}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#f4511e] px-3 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-50"
                >
                  {saving === w.week_key ? <Loader2 size={13} className="animate-spin" /> : saved === w.week_key ? <CheckCircle2 size={13} /> : null}
                  {saved === w.week_key ? "Saved" : "Save week"}
                </button>
              )}

              {w.updated_by && (
                <p className="mt-2 text-[0.65rem] text-[#8c8f94]">Updated by {w.updated_by}</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[0.72rem] text-[#8c8f94]">
        The window always starts at the current ISO week — a finished week drops out on its own and keeps
        its data under history. Each week opens on its entered bank balance, or on the previous week&apos;s
        projected close where none is entered.
      </p>

      <div className="rounded-xl border border-black/[0.06] bg-white">
        <button
          type="button"
          onClick={() => void loadHistory()}
          className="flex w-full items-center gap-2 px-4 py-3 text-[0.8rem] font-semibold text-[#171a20]"
        >
          {historyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          History — finished weeks
        </button>
        {historyOpen && (
          <div className="border-t border-black/[0.06]">
            {historyLoading ? (
              <div className="flex items-center gap-2 p-4 text-[0.83rem] text-[#5c5e62]">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : !history || history.length === 0 ? (
              <p className="p-4 text-[0.83rem] text-[#8c8f94]">No finished weeks recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                      {["Week", "Dates", "Bank balance", "Expected in", "Expected out", "Notes"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((w) => (
                      <tr key={w.week_key} className="border-b border-black/[0.04] last:border-0">
                        <td className="px-3 py-2 text-[0.8rem] font-semibold text-[#171a20]">{w.label}</td>
                        <td className="px-3 py-2 text-[0.75rem] text-[#8c8f94]">{w.starts_on} → {w.ends_on}</td>
                        <td className="px-3 py-2 text-[0.8rem] tabular-nums">{formatMoney(w.bank_balance, "EUR")}</td>
                        <td className="px-3 py-2 text-[0.8rem] tabular-nums">{formatMoney(w.expected_in, "EUR")}</td>
                        <td className="px-3 py-2 text-[0.8rem] tabular-nums">{formatMoney(w.expected_out, "EUR")}</td>
                        <td className="px-3 py-2 text-[0.75rem] text-[#5c5e62]">{w.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
