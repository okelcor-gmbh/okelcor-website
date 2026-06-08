"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, AlertCircle, Search, Eye, ShieldCheck, UserX, Sliders,
  Clock, BadgeCheck, ShieldAlert, KeyRound, X,
} from "lucide-react";
import AccessProfileModal from "@/components/admin/access-profile-modal";
import AccessRequestsTable from "@/components/admin/access-requests-table";
import {
  ACCESS_LEVEL_LABELS, ACCESS_LEVEL_STYLES,
  BUYER_TIER_LABELS, BUYER_TIER_STYLES,
  VERIFICATION_STATUS_LABELS, VERIFICATION_STATUS_STYLES,
  RISK_LEVEL_LABELS, RISK_LEVEL_STYLES,
  RISK_LEVELS, BUYER_TIERS, APPROVAL_PROFILES,
  healthScoreColor, riskFromHealth, approvalSuccessMessage,
  type ApprovalProfileKey,
} from "@/lib/crm8";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApprovalRow {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  company_name?: string | null;
  country?: string | null;
  customer_segment?: string | null;
  access_level?: string | null;
  buyer_tier?: string | null;
  verification_status?: string | null;
  health_score?: number | null;
  risk_level?: string | null;
  approved_for_quotes?: boolean;
  approved_for_checkout?: boolean;
  approved_for_documents?: boolean;
  approved_for_wholesale_pricing?: boolean;
}

type Queue = "pending_review" | "approved" | "wholesale" | "restricted" | "blocked" | "high_risk";

const QUEUES: { key: Queue; label: string; params: Record<string, string> }[] = [
  { key: "pending_review", label: "Pending Review",   params: { status: "pending_review" } },
  { key: "approved",       label: "Approved Buyers",  params: { status: "approved" } },
  { key: "wholesale",      label: "Wholesale Buyers", params: { access_level: "wholesale_buyer" } },
  { key: "restricted",     label: "Restricted",       params: { status: "restricted" } },
  { key: "blocked",        label: "Blocked",          params: { status: "blocked" } },
  { key: "high_risk",      label: "High Risk",        params: { risk_level: "high" } },
];

function fullName(r: ApprovalRow): string {
  return [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email;
}

// ── Summary card ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, tone }: {
  icon: React.ElementType; label: string; value: number | null; tone: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={17} strokeWidth={1.9} />
        </div>
        <span className="text-[1.6rem] font-extrabold leading-none text-[#1a1a1a]">
          {value == null ? "—" : value.toLocaleString()}
        </span>
      </div>
      <p className="mt-3 text-[0.78rem] font-semibold text-[#5c5e62]">{label}</p>
    </div>
  );
}

// ── Reject reason modal ─────────────────────────────────────────────────────

function RejectModal({ name, busy, onConfirm, onCancel }: {
  name: string; busy: boolean; onConfirm: (reason: string) => void; onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <p className="text-[1rem] font-extrabold text-[#1a1a1a]">Reject buyer application</p>
        <p className="mt-1 text-[0.83rem] text-[#5c5e62]">Rejecting <span className="font-semibold">{name}</span>. The reason is recorded on the timeline.</p>
        <textarea
          value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="Reason for rejection…"
          className="mt-4 w-full resize-none rounded-xl border border-black/[0.1] bg-[#fafafa] p-3 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-red-400"
        />
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onCancel} disabled={busy}
            className="flex-1 h-10 rounded-xl border border-black/[0.1] text-[0.83rem] font-semibold text-[#5c5e62] hover:bg-[#f0f2f5] disabled:opacity-50">Cancel</button>
          <button type="button" onClick={() => onConfirm(reason.trim())} disabled={busy}
            className="flex flex-1 h-10 items-center justify-center gap-2 rounded-xl bg-red-600 text-[0.83rem] font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />} Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomerApprovalsPage() {
  const [view, setView] = useState<"approvals" | "requests">("approvals");

  // Filters
  const [queue, setQueue]   = useState<Queue>("pending_review");
  const [risk, setRisk]     = useState("");
  const [tier, setTier]     = useState("");
  const [search, setSearch] = useState("");
  const [debSearch, setDebSearch] = useState("");

  // Table
  const [rows, setRows]       = useState<ApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUA]  = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [notice, setNotice]   = useState<string | null>(null);

  // Cards
  const [counts, setCounts] = useState<{ pending: number | null; verified: number | null; highRisk: number | null; requests: number | null }>({
    pending: null, verified: null, highRisk: null, requests: null,
  });

  // Action state
  const [modalRow, setModalRow]   = useState<ApprovalRow | null>(null);
  const [rejectRow, setRejectRow] = useState<ApprovalRow | null>(null);
  const [busy, setBusy]           = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ── Fetch table ────────────────────────────────────────────────────────────

  const fetchRows = useCallback(async () => {
    setLoading(true); setError(null);
    const params = new URLSearchParams({ per_page: "50", ...QUEUES.find((q) => q.key === queue)!.params });
    if (risk)      params.set("risk_level", risk);
    if (tier)      params.set("buyer_tier", tier);
    if (debSearch) params.set("q", debSearch);
    try {
      const res = await fetch(`/api/admin/customer-approvals?${params}`, { cache: "no-store" });
      if (res.status === 404 || res.status === 405) { setUA(true); setRows([]); return; }
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) { setError((json.error as string) ?? (json.message as string) ?? `Error ${res.status}`); return; }
      setRows((Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []) as ApprovalRow[]);
      setUA(false);
    } catch {
      setError("Could not load the approval queue.");
    } finally {
      setLoading(false);
    }
  }, [queue, risk, tier, debSearch]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // ── Fetch summary counts ─────────────────────────────────────────────────────

  const countFor = useCallback(async (path: string, params: Record<string, string>): Promise<number | null> => {
    try {
      const p = new URLSearchParams({ per_page: "1", ...params });
      const res = await fetch(`/api/admin/${path}?${p}`, { cache: "no-store" });
      if (!res.ok) return null;
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      const meta = json.meta as Record<string, unknown> | undefined;
      if (typeof meta?.total === "number") return meta.total;
      if (Array.isArray(json.data)) return json.data.length;
      return null;
    } catch { return null; }
  }, []);

  const loadCounts = useCallback(async () => {
    const [pending, verified, highRisk, requests] = await Promise.all([
      countFor("customer-approvals", { status: "pending_review" }),
      countFor("customer-approvals", { verification_status: "verified" }),
      countFor("customer-approvals", { risk_level: "high" }),
      countFor("customer-access-requests", { status: "pending" }),
    ]);
    setCounts({ pending, verified, highRisk, requests });
  }, [countFor]);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  // ── Apply profile / approve ──────────────────────────────────────────────────

  async function applyProfile(profileKey: ApprovalProfileKey, notes: string) {
    if (!modalRow) return;
    setBusy(true); setError(null); setNotice(null);
    const positive = profileKey === "approved_buyer" || profileKey === "wholesale_buyer";
    const path = positive ? "approve" : "approval-profile";
    const body = positive
      ? { profile: profileKey, buyer_tier: APPROVAL_PROFILES[profileKey].tier, notes }
      : { profile: profileKey, notes };
    try {
      const res = await fetch(`/api/admin/customers/${modalRow.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (res.ok) {
        setModalRow(null);
        setNotice(approvalSuccessMessage(profileKey, (json.data ?? json) as Record<string, unknown>));
        await Promise.all([fetchRows(), loadCounts()]);
      } else {
        setError((json.message as string) ?? "Could not apply the profile.");
      }
    } catch {
      setError("Network error.");
    } finally { setBusy(false); }
  }

  async function rejectRowNow(reason: string) {
    if (!rejectRow) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      const res = await fetch(`/api/admin/customers/${rejectRow.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reason ? { reason } : {}),
      });
      if (res.ok) {
        setRejectRow(null);
        setNotice("Customer application rejected.");
        await Promise.all([fetchRows(), loadCounts()]);
      } else {
        const json = await res.json().catch(() => ({})) as Record<string, unknown>;
        setError((json.message as string) ?? "Could not reject the customer.");
      }
    } catch {
      setError("Network error.");
    } finally { setBusy(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8">
      <div className="mb-7">
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#E85C1A]">Buyer Lifecycle</p>
        <h1 className="mt-1 text-[1.3rem] font-extrabold text-[#1a1a1a]">Customer Approvals</h1>
        <p className="mt-1 text-[0.875rem] text-[#5c5e62]">Approve buyers, set tiers, and manage access requests.</p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Clock}       label="Pending Approvals"      value={counts.pending}  tone="bg-amber-100 text-amber-700" />
        <StatCard icon={BadgeCheck}  label="Verified Buyers"        value={counts.verified} tone="bg-emerald-100 text-emerald-700" />
        <StatCard icon={ShieldAlert} label="High Risk"              value={counts.highRisk} tone="bg-red-100 text-red-700" />
        <StatCard icon={KeyRound}    label="Access Requests Pending" value={counts.requests} tone="bg-indigo-100 text-indigo-700" />
      </div>

      {/* View toggle */}
      <div className="mb-5 flex gap-2">
        {([["approvals", "Buyer Approvals"], ["requests", "Access Requests"]] as const).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setView(key)}
            className={`rounded-full px-4 py-2 text-[0.83rem] font-semibold transition ${view === key ? "bg-[#1a1a1a] text-white" : "border border-black/[0.1] text-[#5c5e62] hover:bg-[#f0f2f5]"}`}>
            {label}
            {key === "requests" && counts.requests ? (
              <span className="ml-1.5 rounded-full bg-[#E85C1A] px-1.5 py-0.5 text-[0.65rem] font-extrabold text-white">{counts.requests}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.83rem] text-red-700">
          <AlertCircle size={14} /><span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}
      {notice && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[0.83rem] text-emerald-800">
          <ShieldCheck size={14} /><span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={14} /></button>
        </div>
      )}

      {view === "requests" ? (
        <AccessRequestsTable onPendingCount={(n) => setCounts((c) => ({ ...c, requests: n }))} />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Filters */}
          <div className="border-b border-black/[0.06] px-5 py-3">
            <div className="mb-2.5 flex flex-wrap gap-1">
              {QUEUES.map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setQueue(key)}
                  className={`rounded-full px-3 py-1 text-[0.75rem] font-semibold transition ${queue === key ? "bg-[#E85C1A] text-white" : "text-[#5c5e62] hover:bg-[#f0f2f5]"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <select value={risk} onChange={(e) => setRisk(e.target.value)}
                  className="h-8 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.75rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]">
                  <option value="">All risk</option>
                  {RISK_LEVELS.map((r) => <option key={r} value={r}>{RISK_LEVEL_LABELS[r]}</option>)}
                </select>
                <select value={tier} onChange={(e) => setTier(e.target.value)}
                  className="h-8 rounded-lg border border-black/[0.09] bg-white px-2.5 text-[0.75rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]">
                  <option value="">All tiers</option>
                  {BUYER_TIERS.map((t) => <option key={t} value={t}>{BUYER_TIER_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
                <input type="search" placeholder="Name, email, company…" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-60 rounded-xl border border-black/[0.09] bg-[#fafafa] pl-8 pr-3 text-[0.8rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] focus:border-[#E85C1A] focus:ring-2 focus:ring-[#E85C1A]/10" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
              <thead>
                <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                  {["Customer", "Company", "Country", "Segment", "Access", "Tier", "Verification", "Health", "Risk", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[#5c5e62]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {unavailable ? (
                  <tr><td colSpan={10} className="px-5 py-12 text-center">
                    <p className="text-[0.83rem] text-[#9ca3af]">Approval queue not available yet.</p>
                    <p className="mt-1 font-mono text-[0.72rem] text-[#d1d5db]">Backend: GET /admin/customer-approvals</p>
                  </td></tr>
                ) : loading ? (
                  <tr><td colSpan={10} className="px-5 py-12 text-center"><Loader2 size={20} className="mx-auto animate-spin text-[#E85C1A]" /></td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={10} className="px-5 py-12 text-center text-[0.875rem] text-[#5c5e62]">No customers in this queue.</td></tr>
                ) : (
                  rows.map((r) => {
                    const rLevel = (r.risk_level as string) ?? riskFromHealth(r.health_score);
                    const vStatus = (r.verification_status as string) ?? "not_started";
                    return (
                      <tr key={r.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3">
                          <p className="text-[0.83rem] font-semibold text-[#1a1a1a]">{fullName(r)}</p>
                          <p className="text-[0.72rem] text-[#5c5e62]">{r.email}</p>
                        </td>
                        <td className="px-4 py-3 text-[0.8rem] text-[#5c5e62]">{r.company_name || "—"}</td>
                        <td className="px-4 py-3 text-[0.8rem] text-[#5c5e62]">{r.country || "—"}</td>
                        <td className="px-4 py-3 text-[0.78rem] capitalize text-[#5c5e62]">{r.customer_segment?.replace(/_/g, " ") || "—"}</td>
                        <td className="px-4 py-3">
                          {r.access_level ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${ACCESS_LEVEL_STYLES[r.access_level] ?? "bg-gray-100 text-gray-500"}`}>
                              {ACCESS_LEVEL_LABELS[r.access_level] ?? r.access_level}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {r.buyer_tier && r.buyer_tier !== "none" ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${BUYER_TIER_STYLES[r.buyer_tier] ?? "bg-gray-100 text-gray-500"}`}>
                              {BUYER_TIER_LABELS[r.buyer_tier] ?? r.buyer_tier}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${VERIFICATION_STATUS_STYLES[vStatus] ?? "bg-gray-100 text-gray-500"}`}>
                            {VERIFICATION_STATUS_LABELS[vStatus] ?? vStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[0.7rem] font-extrabold ${healthScoreColor(r.health_score)}`}>
                            {r.health_score ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${RISK_LEVEL_STYLES[rLevel] ?? "bg-gray-100 text-gray-500"}`}>
                            {RISK_LEVEL_LABELS[rLevel] ?? rLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button type="button" title="Approve as buyer" onClick={() => setModalRow(r)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50">
                              <ShieldCheck size={13} />
                            </button>
                            <button type="button" title="Apply profile" onClick={() => setModalRow(r)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f0f2f5]">
                              <Sliders size={13} />
                            </button>
                            <button type="button" title="Reject" onClick={() => setRejectRow(r)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50">
                              <UserX size={13} />
                            </button>
                            <Link href={`/admin/customers/${r.id}`} title="View customer"
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f0f2f5]">
                              <Eye size={13} />
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
        </div>
      )}

      {/* Apply profile modal */}
      {modalRow && (
        <AccessProfileModal
          current={{
            access_level:                   modalRow.access_level,
            approved_for_quotes:            modalRow.approved_for_quotes,
            approved_for_checkout:          modalRow.approved_for_checkout,
            approved_for_documents:         modalRow.approved_for_documents,
            approved_for_wholesale_pricing: modalRow.approved_for_wholesale_pricing,
            buyer_tier:                     modalRow.buyer_tier,
          }}
          applying={busy}
          initialProfile="approved_buyer"
          onApply={applyProfile}
          onClose={() => setModalRow(null)}
        />
      )}

      {/* Reject modal */}
      {rejectRow && (
        <RejectModal
          name={fullName(rejectRow)}
          busy={busy}
          onConfirm={rejectRowNow}
          onCancel={() => setRejectRow(null)}
        />
      )}
    </div>
  );
}
