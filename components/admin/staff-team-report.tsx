"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, Info, Loader2, ShieldAlert } from "lucide-react";
import type { StaffTeamReport } from "@/lib/admin-api";

/**
 * Everyone's period, side by side.
 *
 * Two things this screen deliberately does not do, and both are the point:
 *
 * **It does not rank anybody.** Rows are alphabetical, there is no total
 * column, no score and no highlight for "most active". A count of ledger rows
 * is not a measure of value — one order manager's month can be sixty documents
 * while another's is a single container negotiation that took three weeks.
 * Sorting this table by volume would turn a record into a league table, and the
 * data does not support the claim that would make.
 *
 * **It does not group by role.** People are shown under their job title.
 * `admin_users.role` is a permission set: two order managers and the person
 * running operations all hold `admin` because all three need customers,
 * campaigns and quote requests. Grouping by role would file the three of them
 * under "Admin" and describe none of them.
 */
export default function StaffTeamReport() {
  const [range, setRange] = useState(() => defaultRange());
  const [report, setReport] = useState<StaffTeamReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notDeployed, setNotDeployed] = useState(false);
  const [forbidden, setForbidden] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(null);
    try {
      const p = new URLSearchParams({ from: range.from, to: range.to });
      const res = await fetch(`/api/admin/staff/team-report?${p}`);
      const json = await res.json().catch(() => ({}));

      if (res.status === 404 || res.status === 405) { setNotDeployed(true); return; }
      if (res.status === 403) {
        setForbidden(json?.message ?? "You can see your own record, but not the team's.");
        return;
      }
      if (!res.ok) { setError(json?.message ?? `Could not load the report (${res.status}).`); return; }

      setNotDeployed(false);
      setReport((json?.data ?? null) as StaffTeamReport | null);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => { load(); }, [load]);

  if (notDeployed) {
    return (
      <Panel>
        <div className="flex items-start gap-2.5 text-[0.83rem] text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">The team report isn&apos;t available on the server yet.</p>
            <p className="mt-1 leading-relaxed">
              It needs the contribution ledger endpoints and their migration.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  if (forbidden) {
    return (
      <Panel>
        <div className="flex items-start gap-2.5 text-[0.83rem] text-[#5c5e62]">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-[#8c8f94]" />
          <div>
            <p className="font-semibold text-[#171a20]">{forbidden}</p>
            <p className="mt-1">
              <Link href="/admin/contribution" className="text-[#f4511e] hover:underline">
                Open your own record
              </Link>
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  const th = "px-3 py-2 text-left text-[0.66rem] font-bold uppercase tracking-wider text-[#5c5e62]";
  const td = "px-3 py-2.5 text-[0.83rem] text-[#171a20]";

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">From</span>
          <input
            type="date" value={range.from} max={range.to}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[0.83rem] outline-none focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/25"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">To</span>
          <input
            type="date" value={range.to} min={range.from}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[0.83rem] outline-none focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/25"
          />
        </label>
        {loading && (
          <span className="flex items-center gap-1.5 pb-2 text-[0.78rem] text-[#8c8f94]">
            <Loader2 size={12} className="animate-spin" /> Loading…
          </span>
        )}
      </div>

      {error && (
        <Panel>
          <div className="flex items-start gap-2.5 text-[0.83rem] text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
          </div>
        </Panel>
      )}

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              value={`${report.totals.people_with_activity} / ${report.totals.people}`}
              label="People with recorded activity"
            />
            <Stat value={report.totals.recorded} label="Recorded actions" />
            <Stat
              value={report.totals.self_reported}
              label="Self-reported entries"
              hint={report.totals.awaiting_review > 0
                ? `${report.totals.awaiting_review} awaiting review`
                : undefined}
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.08]">
                    <th className={th}>Person</th>
                    <th className={`${th} text-right`}>Recorded</th>
                    <th className={`${th} text-right`}>Self-reported</th>
                    <th className={`${th} text-right`}>Awaiting review</th>
                    <th className={th}>Busiest areas</th>
                  </tr>
                </thead>
                <tbody>
                  {report.people.map((p) => {
                    const top = [...p.recorded.by_category]
                      .filter((c) => c.total > 0)
                      .sort((a, b) => b.total - a.total)
                      .slice(0, 3);

                    return (
                      <tr key={p.admin_user_id} className="border-b border-black/[0.05] last:border-0">
                        <td className={td}>
                          <Link
                            href={`/admin/contribution?admin_user_id=${p.admin_user_id}`}
                            className="font-semibold text-[#171a20] hover:text-[#f4511e]"
                          >
                            {p.name}
                          </Link>
                          <span className="mt-0.5 block text-[0.72rem] text-[#5c5e62]">
                            {p.job_title}
                            {/* Flagged rather than hidden: a title derived from
                                the permission set is a guess, and somebody
                                should set a real one. */}
                            {!p.job_title_set && (
                              <span className="ml-1 text-[#a6a9ae]">(from role — not set)</span>
                            )}
                          </span>
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{p.recorded.total}</td>
                        <td className={`${td} text-right tabular-nums`}>{p.self_reported.total}</td>
                        <td className={`${td} text-right tabular-nums`}>
                          {p.self_reported.pending > 0 ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.72rem] font-semibold text-amber-800">
                              {p.self_reported.pending}
                            </span>
                          ) : (
                            <span className="text-[#c9ccd1]">—</span>
                          )}
                        </td>
                        <td className={td}>
                          {top.length === 0 ? (
                            <span className="text-[0.78rem] text-[#a6a9ae]">Nothing in this period</span>
                          ) : (
                            <span className="flex flex-wrap gap-1">
                              {top.map((c) => (
                                <span
                                  key={c.category}
                                  className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[0.68rem] text-[#5c5e62]"
                                >
                                  {c.label} <span className="tabular-nums font-semibold">{c.total}</span>
                                </span>
                              ))}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rendered from the payload rather than written into the page — the
              same words travel in the e-mailed digest, and a caveat that only
              exists on one of the two is a caveat half the readers never see. */}
          <div className="rounded-xl border-l-[3px] border-[#f4511e] bg-[#fffaf3] p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-[#8a5a2b]">
              <Info size={12} /> Before reading anything into the numbers
            </p>
            <ul className="flex list-disc flex-col gap-1.5 pl-4">
              {report.caveats.map((c) => (
                <li key={c} className="text-[0.78rem] leading-relaxed text-[#6b5540]">{c}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-black/[0.08] bg-white p-5">{children}</div>;
}

function Stat({ value, label, hint }: { value: string | number; label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-4">
      <p className="text-[1.5rem] font-bold leading-none tabular-nums text-[#171a20]">{value}</p>
      <p className="mt-1.5 text-[0.72rem] font-medium uppercase tracking-wider text-[#5c5e62]">{label}</p>
      {hint && <p className="mt-1 text-[0.72rem] text-amber-700">{hint}</p>}
    </div>
  );
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
