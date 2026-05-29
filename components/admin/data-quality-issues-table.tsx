"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Search, X, RefreshCw, CheckCircle2, AlertOctagon, Copy,
  Loader2, ExternalLink, AlertCircle, ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Issue = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  normalized_email?: string | null;
  company_name?: string | null;
  normalized_company_name?: string | null;
  country?: string | null;
  data_quality_score?: number | null;
  data_quality_flags?: string[] | null;
  data_review_status?: string | null;
  possible_duplicate_of?: number | null;
  possible_duplicate_name?: string | null;
  created_at: string;
};

type Meta = { total?: number; current_page?: number; last_page?: number };

const FLAG_OPTIONS = [
  { value: "",                          label: "All Flags" },
  { value: "duplicate_email",           label: "Duplicate Email" },
  { value: "duplicate_phone",           label: "Duplicate Phone" },
  { value: "duplicate_company_country", label: "Duplicate Company+Country" },
  { value: "missing_phone",             label: "Missing Phone" },
  { value: "missing_country",           label: "Missing Country" },
  { value: "missing_company",           label: "Missing Company" },
  { value: "personal_email_for_b2b",    label: "Personal Email (B2B)" },
  { value: "incomplete_profile",        label: "Incomplete Profile" },
];

const STATUS_OPTIONS = [
  { value: "",                    label: "All Statuses" },
  { value: "needs_review",        label: "Needs Review" },
  { value: "duplicate_suspected", label: "Duplicate Suspected" },
  { value: "clean",               label: "Clean" },
  { value: "ignored",             label: "Ignored" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s?: number | null) {
  if (s == null) return "bg-gray-100 text-gray-400";
  if (s >= 80) return "bg-emerald-100 text-emerald-700";
  if (s >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DataQualityIssuesTable() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [meta, setMeta] = useState<Meta>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [flag, setFlag] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [debQ, setDebQ] = useState("");
  const [actionPending, setActionPending] = useState<{ id: number; action: string } | null>(null);
  const [actionMsg, setActionMsg] = useState<{ id: number; type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), per_page: "20" });
    if (flag)   p.set("flag", flag);
    if (status) p.set("review_status", status);
    if (debQ)   p.set("q", debQ);
    try {
      const res = await fetch(`/api/admin/customers/data-quality/issues?${p}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({ data: [], meta: {} }));
      setIssues(Array.isArray(json.data) ? json.data : []);
      setMeta(json.meta ?? {});
    } catch {
      setIssues([]);
    } finally { setLoading(false); }
  }, [page, flag, status, debQ]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);
  useEffect(() => { setPage(1); }, [flag, status, debQ]);

  async function doAction(id: number, action: string, body?: Record<string, unknown>) {
    setActionPending({ id, action });
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/customers/${id}/data-quality/${action}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as Record<string, unknown>).error as string ?? `Error ${res.status}`);
      const msg = (json as Record<string, unknown>).message as string ?? "Done.";
      setActionMsg({ id, type: "ok", text: msg });
      // Update row status optimistically
      setIssues((prev) => prev.map((issue) => {
        if (issue.id !== id) return issue;
        if (action === "mark-clean") return { ...issue, data_review_status: "clean", data_quality_flags: [] };
        if (action === "ignore-duplicate") return { ...issue, data_review_status: "ignored" };
        return issue;
      }));
    } catch (err) {
      setActionMsg({ id, type: "err", text: err instanceof Error ? err.message : "Action failed." });
    } finally { setActionPending(null); }
  }

  const lastPage = meta.last_page ?? 1;

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, company…"
            className="h-9 w-full rounded-xl border border-black/[0.09] bg-white pl-8 pr-4 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
          {q && (
            <button type="button" onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#1a1a1a]">
              <X size={13} />
            </button>
          )}
        </div>
        <select value={flag} onChange={(e) => setFlag(e.target.value)}
          className="h-9 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]">
          {FLAG_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]">
          {STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="button" onClick={fetchIssues}
          className="flex h-9 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-white px-3 text-[0.8rem] font-semibold text-[#5c5e62] transition hover:bg-[#f5f5f5]">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                {["Customer", "Company", "Score", "Flags", "Duplicate?", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center"><Loader2 size={20} className="mx-auto animate-spin text-[#E85C1A]" /></td></tr>
              ) : issues.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-[0.875rem] text-[#5c5e62]">No data quality issues found.</td></tr>
              ) : (
                issues.map((issue) => {
                  const isPending = actionPending?.id === issue.id;
                  const msg = actionMsg?.id === issue.id ? actionMsg : null;
                  return (
                    <tr key={issue.id} className="group hover:bg-[#fafafa]">
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <Link href={`/admin/customers/${issue.id}`}
                          className="text-[0.875rem] font-semibold text-[#1a1a1a] hover:text-[#E85C1A]">
                          {issue.first_name} {issue.last_name}
                        </Link>
                        <p className="text-[0.73rem] text-[#5c5e62]">{issue.email}</p>
                        {issue.normalized_email && issue.normalized_email !== issue.email.toLowerCase() && (
                          <p className="text-[0.67rem] text-[#9ca3af]">norm: {issue.normalized_email}</p>
                        )}
                      </td>
                      {/* Company */}
                      <td className="px-4 py-3">
                        <p className="text-[0.83rem] text-[#5c5e62]">{issue.company_name ?? "—"}</p>
                        <p className="text-[0.72rem] text-[#9ca3af]">{issue.country ?? ""}</p>
                      </td>
                      {/* Score */}
                      <td className="px-4 py-3">
                        {issue.data_quality_score != null ? (
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[0.8rem] font-extrabold ${scoreColor(issue.data_quality_score)}`}>
                            {issue.data_quality_score}
                          </span>
                        ) : <span className="text-[0.78rem] text-[#9ca3af]">—</span>}
                      </td>
                      {/* Flags */}
                      <td className="px-4 py-3">
                        {issue.data_quality_flags && issue.data_quality_flags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {issue.data_quality_flags.map((f) => (
                              <span key={f} className={`rounded px-1.5 py-0.5 text-[0.63rem] font-semibold ${f.startsWith("duplicate") ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>
                                {f.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        ) : <span className="text-[0.78rem] text-[#9ca3af]">—</span>}
                      </td>
                      {/* Duplicate */}
                      <td className="px-4 py-3">
                        {issue.possible_duplicate_of ? (
                          <div className="flex items-center gap-1.5">
                            <Copy size={12} className="shrink-0 text-amber-500" />
                            <Link href={`/admin/customers/${issue.possible_duplicate_of}`}
                              className="text-[0.75rem] font-semibold text-amber-700 hover:underline">
                              {issue.possible_duplicate_name ?? `#${issue.possible_duplicate_of}`}
                            </Link>
                          </div>
                        ) : <span className="text-[0.78rem] text-[#9ca3af]">—</span>}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        {issue.data_review_status ? (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold ${issue.data_review_status === "clean" ? "bg-emerald-100 text-emerald-700" : issue.data_review_status === "duplicate_suspected" ? "bg-amber-100 text-amber-700" : issue.data_review_status === "ignored" ? "bg-gray-100 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                            {issue.data_review_status.replace(/_/g, " ")}
                          </span>
                        ) : <span className="text-[0.78rem] text-[#9ca3af]">—</span>}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        {msg && (
                          <p className={`mb-1 text-[0.67rem] font-semibold ${msg.type === "ok" ? "text-emerald-700" : "text-red-600"}`}>
                            {msg.text}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button" disabled={isPending} onClick={() => doAction(issue.id, "recalculate")}
                            title="Recalculate score"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f5f5f5] disabled:opacity-40">
                            {isPending && actionPending?.action === "recalculate" ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          </button>
                          {issue.data_review_status !== "clean" && (
                            <button type="button" disabled={isPending} onClick={() => doAction(issue.id, "mark-clean")}
                              title="Mark clean"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40">
                              {isPending && actionPending?.action === "mark-clean" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            </button>
                          )}
                          {issue.possible_duplicate_of && issue.data_review_status !== "ignored" && (
                            <button type="button" disabled={isPending} onClick={() => doAction(issue.id, "ignore-duplicate")}
                              title="Ignore duplicate"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:opacity-40">
                              {isPending && actionPending?.action === "ignore-duplicate" ? <Loader2 size={12} className="animate-spin" /> : <AlertOctagon size={12} />}
                            </button>
                          )}
                          <Link href={`/admin/customers/${issue.id}`} title="View customer"
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#E85C1A]/10 hover:text-[#E85C1A]">
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3">
            <p className="text-[0.78rem] text-[#5c5e62]">
              Page {page} of {lastPage}
              {typeof meta.total === "number" && ` · ${meta.total} issues`}
            </p>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition hover:border-[#E85C1A] disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button type="button" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.09] transition hover:border-[#E85C1A] disabled:cursor-not-allowed disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
