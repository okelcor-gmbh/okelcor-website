"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, AlertCircle, BadgeCheck, CalendarDays, ChevronLeft, ChevronRight,
  ExternalLink, FileText, Loader2, PenLine, Plus, ShieldQuestion, Trash2, Paperclip,
} from "lucide-react";
import type {
  StaffActivity, StaffContribution, StaffMember, StaffSummary,
} from "@/lib/admin-api";
import StaffContributionForm from "./staff-contribution-form";

/**
 * A person's contribution record: what the system watched them do, and what
 * they entered themselves.
 *
 * **The two are never one number.** The API keeps them in separate tables,
 * returns them as separate objects and provides no combined total — this screen
 * holds the same line. Recorded work sits under a solid panel with a check;
 * self-reported work sits under a dashed one with its own chip, before and
 * after anyone verifies it. A tile reading "47 things this month" that quietly
 * folds nine self-entered rows into thirty-eight observed ones would undo the
 * only promise that makes a system like this acceptable to the people in it.
 *
 * There is deliberately no score, no ranking and no comparison between people.
 * That is phase 3, and it waits on a business decision about whether any of
 * this touches pay.
 */

type Tab = "recorded" | "logged";

const STATUS_STYLES: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-800 ring-amber-200",
  verified: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rejected: "bg-[#f3f4f6] text-[#5c5e62] ring-black/10",
};

export default function StaffLedger({ initialAdminUserId }: { initialAdminUserId?: number }) {
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [canViewTeam, setCanViewTeam] = useState(false);
  // Seeded from the URL so the team report can link straight at one person.
  // Without it that link lands on the reader's own record and silently shows
  // the wrong month to somebody who thinks they clicked a name.
  const [subjectId, setSubjectId] = useState<number | null>(initialAdminUserId ?? null);

  const [range, setRange] = useState(() => defaultRange());
  const [tab, setTab] = useState<Tab>("recorded");

  const [summary, setSummary] = useState<StaffSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notDeployed, setNotDeployed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // ── who can be looked at ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/staff/members");
        if (res.status === 404 || res.status === 405) {
          if (!cancelled) setNotDeployed(true);
          return;
        }
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        setMembers((json?.data ?? []) as StaffMember[]);
        setCanViewTeam(Boolean(json?.meta?.can_view_team));
      } catch {
        /* the summary call below reports the failure — one message, not two */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── the summary ─────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ from: range.from, to: range.to });
      if (subjectId) p.set("admin_user_id", String(subjectId));

      const res = await fetch(`/api/admin/staff/summary?${p}`);
      const json = await res.json().catch(() => ({}));

      if (res.status === 404 || res.status === 405) { setNotDeployed(true); return; }
      if (res.status === 403) { setError(json?.message ?? "You can only see your own record."); return; }
      if (!res.ok) { setError(json?.message ?? `Could not load the record (${res.status}).`); return; }

      setNotDeployed(false);
      setSummary((json?.data ?? null) as StaffSummary | null);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, subjectId]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const self = members.find((m) => m.is_self);
  const viewing = summary?.admin_user;
  const isSelf = !subjectId || subjectId === self?.id;

  if (notDeployed) {
    return (
      <Panel>
        <div className="flex items-start gap-2.5 text-[0.83rem] text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold">Your work record isn&apos;t available on the server yet.</p>
            <p className="mt-1 leading-relaxed">
              It needs the contribution ledger endpoints and their migration. Nothing is being
              lost in the meantime — the record is built from history the system has been
              keeping for months, so it opens with your past work already in it rather than
              starting from zero.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        {canViewTeam && members.length > 1 && (
          <label className="flex flex-col gap-1">
            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]">
              Whose record
            </span>
            <select
              value={subjectId ?? self?.id ?? ""}
              onChange={(e) => setSubjectId(Number(e.target.value))}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[0.83rem] text-[#171a20] outline-none focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/25"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}{m.is_self ? " (you)" : ` — ${m.job_title}`}
                </option>
              ))}
            </select>
          </label>
        )}

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

      {viewing && !isSelf && (
        <p className="rounded-lg bg-[#f3f4f6] px-3 py-2 text-[0.82rem] text-[#5c5e62]">
          Viewing <strong className="font-semibold text-[#171a20]">{viewing.name}</strong>
          {viewing.job_title ? ` — ${viewing.job_title}` : ""}. They can see this same record themselves.
        </p>
      )}

      {toast && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[0.82rem] text-emerald-900">{toast}</p>
      )}

      {error && (
        <Panel>
          <div className="flex items-start gap-2.5 text-[0.83rem] text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        </Panel>
      )}

      {/* ── The two halves, side by side and visibly different ─────────── */}
      {summary && (
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Recorded — solid panel, the system's own observation */}
          <div className="rounded-xl border border-black/[0.08] bg-white p-5">
            <div className="flex items-center gap-2">
              <BadgeCheck size={15} className="text-emerald-600" />
              <h2 className="text-[0.83rem] font-bold uppercase tracking-wider text-[#171a20]">
                Recorded work
              </h2>
            </div>
            <p className="mt-1 text-[0.76rem] leading-snug text-[#5c5e62]">
              What the system watched happen. Every item links to the record it belongs to.
            </p>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-3">
              <Figure value={summary.recorded.total} label="Items" />
              <Figure
                value={summary.recorded.active_days}
                label="Days with activity"
                hint="Context, not a score — it tells you whether this was a full month or a fortnight of leave."
              />
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              {summary.recorded.by_category.map((c) => (
                <Bar
                  key={c.category}
                  label={c.label}
                  value={c.total}
                  max={Math.max(1, ...summary.recorded.by_category.map((x) => x.total))}
                />
              ))}
            </div>
          </div>

          {/* Self-reported — dashed, so the difference is legible at a glance
              rather than only in a label somebody has to read */}
          <div className="rounded-xl border border-dashed border-black/20 bg-[#fcfcfd] p-5">
            <div className="flex items-center gap-2">
              <PenLine size={15} className="text-[#f4511e]" />
              <h2 className="text-[0.83rem] font-bold uppercase tracking-wider text-[#171a20]">
                Self-reported work
              </h2>
            </div>
            <p className="mt-1 text-[0.76rem] leading-snug text-[#5c5e62]">
              Entered by hand, for work outside the system. Kept apart from the figures on the
              left and never added to them.
            </p>

            {summary.self_reported.available ? (
              <>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-8 gap-y-3">
                  <Figure value={summary.self_reported.total} label="Entries" />
                  <Figure value={summary.self_reported.verified} label="Verified" />
                  <Figure value={summary.self_reported.pending} label="Awaiting review" />
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                  {summary.self_reported.by_category
                    .filter((c) => c.total > 0)
                    .map((c) => (
                      <Bar
                        key={c.category}
                        label={c.label}
                        value={c.total}
                        max={Math.max(1, ...summary.self_reported.by_category.map((x) => x.total))}
                        muted
                      />
                    ))}
                  {summary.self_reported.total === 0 && (
                    <p className="text-[0.8rem] text-[#8c8f94]">
                      Nothing logged in this period.
                      {isSelf && " The Logged tab below is where the trade fairs and supplier calls go."}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-4 text-[0.8rem] leading-snug text-[#8c8f94]">
                Not available on this server yet.
              </p>
            )}
          </div>
        </div>
      )}

      {summary?.note && (
        <p className="flex items-start gap-1.5 text-[0.73rem] leading-relaxed text-[#8c8f94]">
          <ShieldQuestion size={12} className="mt-0.5 shrink-0" />
          {summary.note}
        </p>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-black/[0.08]">
        {([
          ["recorded", "Recorded"],
          ["logged", isSelf ? "Logged by me" : `Logged by ${firstName(viewing?.name)}`],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-3 py-2 text-[0.83rem] font-semibold transition ${
              tab === value
                ? "border-[#f4511e] text-[#171a20]"
                : "border-transparent text-[#5c5e62] hover:text-[#171a20]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "recorded" ? (
        <ActivityFeed subjectId={subjectId} from={range.from} to={range.to} />
      ) : (
        <ContributionList
          subjectId={subjectId}
          isSelf={isSelf}
          from={range.from}
          to={range.to}
          onChanged={(msg) => { setToast(msg); loadSummary(); }}
        />
      )}
    </div>
  );
}

// ── Recorded feed ────────────────────────────────────────────────────────────

function ActivityFeed({
  subjectId, from, to,
}: { subjectId: number | null; from: string; to: string }) {
  const [rows, setRows] = useState<StaffActivity[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setPage(1); }, [subjectId, from, to]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams({ from, to, page: String(page), per_page: "25" });
        if (subjectId) p.set("admin_user_id", String(subjectId));
        const res = await fetch(`/api/admin/staff/activity?${p}`);
        const json = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        setRows((json?.data ?? []) as StaffActivity[]);
        setLastPage(json?.meta?.last_page ?? 1);
        setTotal(json?.meta?.total ?? 0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subjectId, from, to, page]);

  if (loading && rows.length === 0) {
    return <Panel><span className="flex items-center gap-2 text-[0.83rem] text-[#5c5e62]">
      <Loader2 size={14} className="animate-spin" /> Loading the record…
    </span></Panel>;
  }

  if (rows.length === 0) {
    return (
      <Panel>
        <p className="text-[0.83rem] leading-relaxed text-[#5c5e62]">
          Nothing recorded in this period. If that looks wrong, the ledger may not have been
          built from existing history yet — that is a one-off command on the server, not a
          gap in what happened.
        </p>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-white">
        <ul className="divide-y divide-black/[0.06]">
          {rows.map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.85rem] font-semibold text-[#171a20]">{a.action_label}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.75rem] text-[#5c5e62]">
                  <span className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[0.68rem] font-medium">
                    {a.category_label}
                  </span>
                  {a.subject_label && (
                    <SubjectLink type={a.subject_type} id={a.subject_id} label={a.subject_label} />
                  )}
                </p>
              </div>
              <time className="shrink-0 text-[0.73rem] tabular-nums text-[#8c8f94]">
                {fmtDateTime(a.occurred_at)}
              </time>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between text-[0.78rem] text-[#5c5e62]">
        <span className="tabular-nums">{total} recorded in this period</span>
        {lastPage > 1 && (
          <span className="flex items-center gap-1">
            <button
              type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="rounded p-1 disabled:opacity-30" aria-label="Previous page"
            ><ChevronLeft size={15} /></button>
            <span className="tabular-nums">{page} / {lastPage}</span>
            <button
              type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}
              className="rounded p-1 disabled:opacity-30" aria-label="Next page"
            ><ChevronRight size={15} /></button>
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Every recorded item points at something openable. A number nobody can click
 * into is a number nobody trusts — which matters more here than on most screens,
 * because the number is about a person.
 */
function SubjectLink({
  type, id, label,
}: { type: string | null; id: number | null; label: string }) {
  const href =
    type === "order" && id ? `/admin/orders/${id}`
    : type === "campaign" && id ? `/admin/marketing/campaigns`
    : type === "customer" && id ? `/admin/customers/${id}`
    : type === "finance_invoice" ? `/admin/finance-invoices`
    : type === "partner_sale" ? `/admin/partner-sales`
    : null;

  if (!href) return <span className="font-mono text-[0.72rem]">{label}</span>;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 font-mono text-[0.72rem] text-[#f4511e] hover:underline"
    >
      {label}<ExternalLink size={10} />
    </Link>
  );
}

// ── Self-reported list ───────────────────────────────────────────────────────

function ContributionList({
  subjectId, isSelf, from, to, onChanged,
}: {
  subjectId: number | null;
  isSelf: boolean;
  from: string;
  to: string;
  onChanged: (message: string) => void;
}) {
  const [rows, setRows] = useState<StaffContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [notDeployed, setNotDeployed] = useState(false);
  const [formFor, setFormFor] = useState<StaffContribution | null | undefined>(undefined);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ from, to, per_page: "50" });
      if (subjectId) p.set("admin_user_id", String(subjectId));
      const res = await fetch(`/api/admin/staff/contributions?${p}`);
      if (res.status === 404 || res.status === 405) { setNotDeployed(true); return; }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setNotDeployed(false);
      setRows((json?.data ?? []) as StaffContribution[]);
    } catch {
      /* handled by the summary's error panel above */
    } finally {
      setLoading(false);
    }
  }, [subjectId, from, to]);

  useEffect(() => { load(); }, [load]);

  async function review(row: StaffContribution, decision: "verified" | "rejected") {
    // A rejection with no reason is not something anyone can act on, and the
    // API refuses it — so ask here rather than letting it come back as a
    // validation error on a field the reviewer never saw.
    let note: string | null = null;
    if (decision === "rejected") {
      note = window.prompt("Why is this being rejected? The person will see this.");
      if (!note || !note.trim()) return;
    }

    setBusy(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/contributions/${row.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message ?? `Could not save the review (${res.status}).`);
        return;
      }
      onChanged(json?.message ?? "Review saved.");
      load();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(row: StaffContribution) {
    if (!window.confirm(`Remove "${row.title}"?`)) return;
    setBusy(row.id);
    try {
      const res = await fetch(`/api/admin/staff/contributions/${row.id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json?.message ?? "Could not remove the entry."); return; }
      onChanged("Entry removed.");
      load();
    } finally {
      setBusy(null);
    }
  }

  if (notDeployed) {
    return <Panel><p className="text-[0.83rem] text-[#5c5e62]">
      Logging work isn&apos;t available on this server yet.
    </p></Panel>;
  }

  return (
    <div className="flex flex-col gap-3">
      {isSelf && (
        <div>
          <button
            type="button"
            onClick={() => setFormFor(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#f4511e] px-3.5 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#d24f13]"
          >
            <Plus size={14} /> Log work
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[0.8rem] text-red-800">{error}</p>
      )}

      {loading && rows.length === 0 ? (
        <Panel><span className="flex items-center gap-2 text-[0.83rem] text-[#5c5e62]">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </span></Panel>
      ) : rows.length === 0 ? (
        <Panel>
          <p className="text-[0.83rem] leading-relaxed text-[#5c5e62]">
            {isSelf
              ? "Nothing logged in this period. Supplier calls, trade fairs, social media, training — the work the system has no way of seeing goes here."
              : "Nothing logged in this period."}
          </p>
        </Panel>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-dashed border-black/20 bg-[#fcfcfd] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[0.88rem] font-semibold text-[#171a20]">{row.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.73rem] text-[#5c5e62]">
                    <span className="rounded bg-[#f3f4f6] px-1.5 py-0.5 text-[0.68rem] font-medium">
                      {row.category_label}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <CalendarDays size={11} /> {fmtDate(row.performed_on)}
                    </span>
                    {row.minutes ? <span className="tabular-nums">{row.minutes} min</span> : null}
                    {!row.has_evidence && (
                      <span className="text-[#8c8f94]">no evidence attached</span>
                    )}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider ring-1 ring-inset ${
                    STATUS_STYLES[row.status] ?? STATUS_STYLES.rejected
                  }`}
                >
                  {row.status === "pending" ? "Awaiting review" : row.status}
                </span>
              </div>

              {row.description && (
                <p className="mt-2 whitespace-pre-line text-[0.8rem] leading-relaxed text-[#5c5e62]">
                  {row.description}
                </p>
              )}

              <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[0.76rem]">
                {row.link && (
                  <a
                    href={row.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#f4511e] hover:underline"
                  >
                    <ExternalLink size={11} /> Open link
                  </a>
                )}
                {row.has_file && (
                  <a
                    href={`/api/admin/staff/contributions/${row.id}/file`}
                    className="inline-flex items-center gap-1 text-[#f4511e] hover:underline"
                  >
                    <Paperclip size={11} /> {row.file_name ?? "Evidence"}
                  </a>
                )}
                {!isSelf && row.logged_by.name && (
                  <span className="text-[#8c8f94]">by {row.logged_by.name}</span>
                )}
              </div>

              {row.review_note && (
                <p className="mt-2.5 rounded-lg bg-[#f3f4f6] px-2.5 py-2 text-[0.76rem] leading-snug text-[#5c5e62]">
                  <FileText size={11} className="mr-1 inline" />
                  {row.reviewed_by ? `${row.reviewed_by}: ` : ""}{row.review_note}
                </p>
              )}

              {/* Driven by the API's own can_edit / can_review rather than by
                  status plus a permission guess — otherwise the two drift. */}
              {(row.can_edit || row.can_review) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {row.can_edit && (
                    <>
                      <button
                        type="button" onClick={() => setFormFor(row)}
                        className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-[0.78rem] font-semibold text-[#171a20] transition hover:bg-white"
                      ><PenLine size={12} /> Edit</button>
                      <button
                        type="button" onClick={() => remove(row)} disabled={busy === row.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-white disabled:opacity-50"
                      ><Trash2 size={12} /> Remove</button>
                    </>
                  )}
                  {row.can_review && (
                    <>
                      <button
                        type="button" onClick={() => review(row, "verified")} disabled={busy === row.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy === row.id ? <Loader2 size={12} className="animate-spin" /> : <BadgeCheck size={12} />}
                        Verify
                      </button>
                      <button
                        type="button" onClick={() => review(row, "rejected")} disabled={busy === row.id}
                        className="rounded-lg border border-black/10 px-2.5 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-white disabled:opacity-50"
                      >Reject</button>
                    </>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {formFor !== undefined && (
        <StaffContributionForm
          existing={formFor}
          onClose={() => setFormFor(undefined)}
          onSaved={(msg) => { setFormFor(undefined); onChanged(msg); load(); }}
        />
      )}
    </div>
  );
}

// ── bits ─────────────────────────────────────────────────────────────────────

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-black/[0.08] bg-white p-5">{children}</div>;
}

function Figure({ value, label, hint }: { value: number; label: string; hint?: string }) {
  return (
    <div>
      <p className="text-[1.6rem] font-bold leading-none tabular-nums text-[#171a20]">{value}</p>
      <p className="mt-1 text-[0.72rem] font-medium uppercase tracking-wider text-[#5c5e62]">{label}</p>
      {hint && <p className="mt-1 max-w-[22ch] text-[0.68rem] leading-snug text-[#8c8f94]">{hint}</p>}
    </div>
  );
}

function Bar({
  label, value, max, muted,
}: { label: string; value: number; max: number; muted?: boolean }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[9.5rem] shrink-0 truncate text-[0.76rem] text-[#5c5e62]">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0f1f3]">
        <span
          className={`block h-full rounded-full ${muted ? "bg-[#f4511e]/60" : "bg-emerald-500/70"}`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-8 shrink-0 text-right text-[0.76rem] tabular-nums text-[#171a20]">
        {value}
      </span>
    </div>
  );
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .format(new Date(iso));
  } catch { return iso; }
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

function firstName(name?: string | null): string {
  return (name ?? "them").split(" ")[0];
}

