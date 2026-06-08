"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2, AlertCircle, Check, X, Inbox, ExternalLink, KeyRound,
} from "lucide-react";
import {
  REQUESTED_ACCESS_LABELS, ACCESS_REQUEST_STATUS_STYLES, type AccessRequest,
} from "@/lib/crm8";

interface Props {
  /** Bump to force a re-fetch (e.g. after switching tabs). */
  refreshKey?: number;
  onPendingCount?: (n: number) => void;
}

function fmtDT(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

export default function AccessRequestsTable({ refreshKey = 0, onPendingCount }: Props) {
  const [rows, setRows]       = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUA]  = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [busyId, setBusyId]   = useState<number | null>(null);
  const [statusTab, setStatusTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const fetchRows = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = statusTab === "all" ? "" : `?status=${statusTab}`;
      const res = await fetch(`/api/admin/customer-access-requests${qs}`, { cache: "no-store" });
      if (res.status === 404 || res.status === 405) { setUA(true); setRows([]); return; }
      const json = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) { setError((json.message as string) ?? "Failed to load access requests."); return; }
      const raw = (Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []) as AccessRequest[];
      setRows(raw);
      if (statusTab === "pending") onPendingCount?.(raw.length);
    } catch {
      setError("Network error — could not load access requests.");
    } finally {
      setLoading(false);
    }
  }, [statusTab, onPendingCount]);

  useEffect(() => { fetchRows(); }, [fetchRows, refreshKey]);

  async function act(row: AccessRequest, action: "approve" | "reject") {
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/customer-access-requests/${row.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setRows((prev) => {
          const next = prev.map((r) => (r.id === row.id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r));
          if (statusTab === "pending") {
            const remaining = next.filter((r) => r.status === "pending");
            onPendingCount?.(remaining.length);
            return next.filter((r) => r.id !== row.id);
          }
          return next;
        });
      } else {
        const json = await res.json().catch(() => ({})) as Record<string, unknown>;
        setError((json.message as string) ?? `Could not ${action} the request.`);
      }
    } catch {
      setError("Network error.");
    } finally { setBusyId(null); }
  }

  const TABS: { key: typeof statusTab; label: string }[] = [
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all",      label: "All" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <KeyRound size={15} className="text-[#5c5e62]" />
          <p className="text-[0.9rem] font-extrabold text-[#1a1a1a]">Access Requests</p>
        </div>
        <div className="flex gap-1">
          {TABS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setStatusTab(key)}
              className={`rounded-full px-3 py-1 text-[0.75rem] font-semibold transition ${statusTab === key ? "bg-[#E85C1A] text-white" : "text-[#5c5e62] hover:bg-[#f0f2f5]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="m-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[0.8rem] text-red-700">
          <AlertCircle size={13} /><span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)}><X size={12} /></button>
        </div>
      )}

      {unavailable ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[0.83rem] text-[#9ca3af]">Access requests not available yet.</p>
          <p className="mt-1 font-mono text-[0.72rem] text-[#d1d5db]">Backend: GET /admin/customer-access-requests</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#E85C1A]" /></div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <Inbox size={24} className="text-[#d1d5db]" />
          <p className="text-[0.83rem] text-[#9ca3af]">No {statusTab === "all" ? "" : statusTab} access requests.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                {["Customer", "Requested", "Reason", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#5c5e62]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[#fafafa]">
                  <td className="px-5 py-3">
                    <p className="text-[0.83rem] font-semibold text-[#1a1a1a]">{r.customer_name ?? `Customer #${r.customer_id}`}</p>
                    {r.customer_email && <p className="text-[0.72rem] text-[#5c5e62]">{r.customer_email}</p>}
                    {r.company_name && <p className="text-[0.7rem] text-[#9ca3af]">{r.company_name}</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[0.7rem] font-bold text-indigo-600">
                      {REQUESTED_ACCESS_LABELS[r.requested_access] ?? r.requested_access}
                    </span>
                  </td>
                  <td className="max-w-[220px] px-5 py-3 text-[0.78rem] text-[#5c5e62]">{r.reason || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.67rem] font-bold capitalize ${ACCESS_REQUEST_STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[0.78rem] text-[#5c5e62]">{fmtDT(r.created_at)}</td>
                  <td className="px-5 py-3">
                    {busyId === r.id ? (
                      <Loader2 size={15} className="animate-spin text-[#E85C1A]" />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {r.status === "pending" && (
                          <>
                            <button type="button" title="Approve" onClick={() => act(r, "approve")}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 transition hover:bg-emerald-50">
                              <Check size={13} />
                            </button>
                            <button type="button" title="Reject" onClick={() => act(r, "reject")}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50">
                              <X size={13} />
                            </button>
                          </>
                        )}
                        <Link href={`/admin/customers/${r.customer_id}`} title="View customer"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/[0.08] text-[#5c5e62] transition hover:bg-[#f0f2f5]">
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
