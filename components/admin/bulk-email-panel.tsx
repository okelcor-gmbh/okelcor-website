"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Send, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  ChevronLeft, ChevronRight, Users, Eye, X, Filter,
} from "lucide-react";
import type { BulkEmail, BulkEmailStatus } from "@/lib/admin-api";

// Reuse the same TipTap editor used for article bodies (lazy-loaded, client-only)
const ArticleRichEditor = dynamic(
  () => import("@/components/admin/article-rich-editor"),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-[#f0f2f5]" /> }
);

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<BulkEmailStatus, string> = {
  queued:    "Queued",
  sending:   "Sending",
  completed: "Completed",
  failed:    "Failed",
};

const STATUS_BADGE: Record<BulkEmailStatus, string> = {
  queued:    "bg-amber-100 text-amber-700",
  sending:   "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed:    "bg-red-100 text-red-700",
};

function StatusBadge({ status }: { status: BulkEmailStatus | string }) {
  const s = status as BulkEmailStatus;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${STATUS_BADGE[s] ?? "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABEL[s] ?? status}
    </span>
  );
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Progress bar for in-flight campaign ──────────────────────────────────────

function CampaignProgress({ campaignId, onDone }: { campaignId: number; onDone: () => void }) {
  const [campaign, setCampaign] = useState<BulkEmail | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    async function poll() {
      if (doneRef.current) return;
      try {
        const res = await fetch(`/api/admin/bulk-emails/${campaignId}`);
        const json = await res.json().catch(() => null);
        const c: BulkEmail = json?.data ?? json;
        if (!c) return;
        setCampaign(c);
        if (c.status === "completed" || c.status === "failed") {
          doneRef.current = true;
          onDone();
        }
      } catch { /* non-fatal */ }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [campaignId, onDone]);

  if (!campaign) return (
    <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-[0.83rem] text-blue-700">
      <RefreshCw size={14} className="animate-spin" />
      Campaign queued — waiting for status…
    </div>
  );

  const total   = campaign.total_recipients;
  const done    = campaign.sent_count + campaign.failed_count;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
  const isInFlight = campaign.status === "queued" || campaign.status === "sending";

  return (
    <div className={[
      "rounded-xl border p-5",
      campaign.status === "completed" ? "border-emerald-200 bg-emerald-50"
        : campaign.status === "failed" ? "border-red-200 bg-red-50"
        : "border-blue-200 bg-blue-50",
    ].join(" ")}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isInFlight && <RefreshCw size={14} className="animate-spin text-blue-600" />}
          {campaign.status === "completed" && <CheckCircle2 size={14} className="text-emerald-600" />}
          {campaign.status === "failed"    && <AlertTriangle size={14} className="text-red-600" />}
          <p className="text-[0.875rem] font-semibold text-[#171a20]">{campaign.subject}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      {/* Progress bar */}
      <div className="mb-2 overflow-hidden rounded-full bg-white/60 h-2">
        <div
          className={[
            "h-full rounded-full transition-all duration-500",
            campaign.status === "completed" ? "bg-emerald-500"
              : campaign.status === "failed" ? "bg-red-500"
              : "bg-blue-500",
          ].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[0.78rem]">
        <span className="text-[#5c5e62]">
          {done.toLocaleString()} / {total.toLocaleString()} emails
          {campaign.failed_count > 0 && (
            <span className="ml-2 text-red-600">({campaign.failed_count} failed)</span>
          )}
        </span>
        <span className={[
          "font-semibold",
          campaign.status === "completed" ? "text-emerald-700"
            : campaign.status === "failed" ? "text-red-700"
            : "text-blue-700",
        ].join(" ")}>
          {pct}%
        </span>
      </div>
    </div>
  );
}

// ── Audience filters ──────────────────────────────────────────────────────────

type AudienceFilters = { company: string; country: string; status: string; search: string };

function AudienceFiltersCard({
  filters, onChange, count, countLoading,
}: {
  filters: AudienceFilters;
  onChange: (f: AudienceFilters) => void;
  count: number | null;
  countLoading: boolean;
}) {
  const hasFilter = filters.company || filters.country || filters.status || filters.search;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[0.83rem] font-semibold text-[#171a20]">
        <Filter size={14} className="text-[#5c5e62]" />
        Audience (optional — blank = all non-unsubscribed contacts)
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          type="text"
          placeholder="Company"
          value={filters.company}
          onChange={(e) => onChange({ ...filters, company: e.target.value })}
          className="h-9 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
        />
        <input
          type="text"
          placeholder="Country (DE, FR…)"
          value={filters.country}
          onChange={(e) => onChange({ ...filters, country: e.target.value })}
          className="h-9 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
        />
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="h-9 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] focus:border-[#f4511e] focus:outline-none"
        >
          <option value="">Subscribed + Unknown</option>
          <option value="subscribed">Subscribed only</option>
          <option value="unknown">Unknown only</option>
        </select>
        <input
          type="text"
          placeholder="Search keyword"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="h-9 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
        />
      </div>

      {hasFilter && (
        <button
          type="button"
          onClick={() => onChange({ company: "", country: "", status: "", search: "" })}
          className="flex items-center gap-1 text-[0.78rem] text-[#5c5e62] hover:text-[#171a20]"
        >
          <X size={12} /> Clear filters — send to all
        </button>
      )}

      {/* Live recipient count */}
      <div className="flex items-center gap-2">
        <Users size={14} className="text-[#5c5e62]" />
        <span className="text-[0.83rem] text-[#5c5e62]">
          {countLoading
            ? "Counting…"
            : count === null
            ? "Counting recipients…"
            : count === 0
            ? <span className="text-amber-700">0 matching recipients (campaign cannot be sent)</span>
            : <span className="font-semibold text-[#171a20]">{count.toLocaleString()} recipients will receive this email</span>
          }
        </span>
      </div>
    </div>
  );
}

// ── Composer ──────────────────────────────────────────────────────────────────

function Composer({ onSent }: { onSent: (id: number) => void }) {
  const [subject, setSubject]         = useState("");
  const [bodyHtml, setBodyHtml]       = useState("");
  const [filters, setFilters]         = useState<AudienceFilters>({ company: "", country: "", status: "", search: "" });
  const [count, setCount]             = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  // Debounced recipient count fetch
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCountLoading(true);
      const qs = new URLSearchParams();
      if (filters.company) qs.set("company", filters.company);
      if (filters.country) qs.set("country", filters.country);
      if (filters.status)  qs.set("status",  filters.status);
      if (filters.search)  qs.set("search",  filters.search);
      try {
        const res = await fetch(`/api/admin/bulk-emails/recipient-count?${qs.toString()}`);
        const json = await res.json().catch(() => ({ count: 0 }));
        setCount(json.count ?? 0);
      } catch {
        setCount(null);
      } finally {
        setCountLoading(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [filters]);

  async function handleSend() {
    if (!subject.trim()) { setError("Subject is required."); return; }
    if (!bodyHtml.trim() || bodyHtml === "<p></p>") { setError("Email body is required."); return; }
    if (count === 0)     { setError("No matching recipients. Adjust the audience filters."); return; }

    setSending(true);
    setError(null);

    // Build filters payload — only include non-empty values
    const filtersPayload: Record<string, string> = {};
    if (filters.company) filtersPayload.company = filters.company;
    if (filters.country) filtersPayload.country = filters.country;
    if (filters.status)  filtersPayload.status  = filters.status;
    if (filters.search)  filtersPayload.search  = filters.search;

    const body: Record<string, unknown> = { subject: subject.trim(), body_html: bodyHtml };
    if (Object.keys(filtersPayload).length > 0) body.filters = filtersPayload;

    try {
      const res = await fetch("/api/admin/bulk-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 422) {
        setError(json.message ?? "No matching recipients for those filters.");
        return;
      }
      if (!res.ok) {
        setError(json.error ?? json.message ?? `Send failed (${res.status}).`);
        return;
      }

      const campaign: BulkEmail = json.data ?? json;
      setSubject("");
      setBodyHtml("");
      setFilters({ company: "", country: "", status: "", search: "" });
      onSent(campaign.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/[0.07] bg-white p-5 space-y-5">
      <h2 className="text-[0.875rem] font-bold text-[#171a20]">New Campaign</h2>

      {/* Subject */}
      <div>
        <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#5c5e62]">Subject</label>
        <input
          type="text"
          placeholder="e.g. New tyre stock arriving — special pricing for our partners"
          value={subject}
          onChange={(e) => { setSubject(e.target.value); setError(null); }}
          className="h-10 w-full rounded-lg border border-black/[0.10] bg-white px-3 text-[0.875rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
        />
      </div>

      {/* Body */}
      <div>
        <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#5c5e62]">Email body</label>
        <div className="min-h-[280px] rounded-xl border border-black/[0.10] overflow-hidden">
          <ArticleRichEditor value={bodyHtml} onChange={setBodyHtml} />
        </div>
        <p className="mt-1 text-[0.72rem] text-[#8c8f94]">
          An unsubscribe footer link is added automatically by the server — do not add one yourself.
        </p>
      </div>

      {/* Audience */}
      <AudienceFiltersCard
        filters={filters}
        onChange={(f) => { setFilters(f); setError(null); }}
        count={count}
        countLoading={countLoading}
      />

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[0.83rem] text-red-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || count === 0}
          className="flex items-center gap-2 rounded-full bg-[#f4511e] px-6 py-2.5 text-[0.875rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
        >
          {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? "Sending…" : "Send Campaign"}
        </button>
      </div>
    </div>
  );
}

// ── Campaign history table ────────────────────────────────────────────────────

function CampaignHistory({ refreshKey }: { refreshKey: number }) {
  const [campaigns, setCampaigns]   = useState<BulkEmail[]>([]);
  const [meta, setMeta]             = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [preview, setPreview]       = useState<BulkEmail | null>(null);

  const fetchHistory = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bulk-emails?per_page=15&page=${p}`);
      const json = await res.json().catch(() => ({ data: [], meta: {} }));
      setCampaigns(json.data ?? []);
      setMeta({
        current_page: json.meta?.current_page ?? 1,
        last_page:    json.meta?.last_page    ?? 1,
        total:        json.meta?.total        ?? 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(page); }, [fetchHistory, page, refreshKey]);

  return (
    <>
      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-black/[0.06] bg-white px-5 py-4">
              <div>
                <p className="font-bold text-[#171a20]">{preview.subject}</p>
                <p className="text-[0.75rem] text-[#5c5e62]">
                  {preview.total_recipients.toLocaleString()} recipients · {fmt(preview.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-lg p-1.5 text-[#5c5e62] hover:bg-[#f0f2f5] hover:text-[#171a20]"
              >
                <X size={16} />
              </button>
            </div>
            <div
              className="prose max-w-none p-5 text-[0.875rem]"
              dangerouslySetInnerHTML={{ __html: preview.body_html ?? "<p>No body content.</p>" }}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-black/[0.07] bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="text-[0.875rem] font-bold text-[#171a20]">Campaign History</h2>
          <span className="text-[0.78rem] text-[#5c5e62]">{meta.total} campaigns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#f5f5f5]">
                {["Subject", "Filters", "Recipients", "Sent / Failed", "Status", "Sent by", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-wide text-[#5c5e62]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[0.83rem] text-[#5c5e62]">
                    <RefreshCw size={16} className="mx-auto mb-2 animate-spin" />
                    Loading history…
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[0.83rem] text-[#5c5e62]">
                    <Clock size={24} className="mx-auto mb-2 text-[#8c8f94]" />
                    No campaigns sent yet.
                  </td>
                </tr>
              ) : campaigns.map((c) => {
                const filterSummary = c.filters
                  ? Object.entries(c.filters)
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ") || "—"
                  : "All contacts";
                return (
                  <tr key={c.id} className="hover:bg-[#f5f5f5]/60">
                    <td className="max-w-[200px] truncate px-4 py-3 text-[0.83rem] font-medium text-[#171a20]">
                      {c.subject}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-[0.78rem] text-[#5c5e62]">
                      {filterSummary}
                    </td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#171a20]">
                      {c.total_recipients.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#171a20]">
                      <span className="text-emerald-700">{c.sent_count.toLocaleString()}</span>
                      {c.failed_count > 0 && (
                        <span className="ml-1 text-red-600">/ {c.failed_count}</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">{c.created_by}</td>
                    <td className="px-4 py-3 text-[0.78rem] text-[#5c5e62] whitespace-nowrap">
                      {fmt(c.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/admin/bulk-emails/${c.id}`);
                          const json = await res.json().catch(() => null);
                          if (json) setPreview(json.data ?? json);
                        }}
                        title="Preview email body"
                        className="rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20]"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-3">
            <span className="text-[0.78rem] text-[#5c5e62]">Page {meta.current_page} of {meta.last_page}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page >= meta.last_page}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5] disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function BulkEmailPanel() {
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [historyKey, setHistoryKey]             = useState(0);

  function handleSent(id: number) {
    setActiveCampaignId(id);
    setHistoryKey((k) => k + 1); // refresh history immediately
  }

  function handleCampaignDone() {
    setActiveCampaignId(null);
    setHistoryKey((k) => k + 1); // refresh history with final status
  }

  return (
    <div className="space-y-5">
      {/* In-flight progress */}
      {activeCampaignId !== null && (
        <CampaignProgress campaignId={activeCampaignId} onDone={handleCampaignDone} />
      )}

      {/* Composer */}
      <Composer onSent={handleSent} />

      {/* History */}
      <CampaignHistory refreshKey={historyKey} />
    </div>
  );
}
