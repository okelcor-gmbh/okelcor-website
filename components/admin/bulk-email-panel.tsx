"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Send, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  ChevronLeft, ChevronRight, Users, Eye, X, Filter, LayoutTemplate, Code2, CopyPlus,
} from "lucide-react";
import type {
  BulkEmail, BulkEmailStatus, BulkEmailFilters, CampaignBlock, CampaignDraft,
} from "@/lib/admin-api";
import { groupBlockErrors } from "@/lib/campaign-design";
import { useCampaignAutosave, draftHasContent, themeToKey } from "@/hooks/use-campaign-autosave";
import { themeToWire, themeOverridesOf, type CampaignThemeOverrides } from "@/lib/campaign-design";
import { MarketMultiSelect, useMarketOptions } from "./market-select";
import CampaignDesigner from "./campaign/campaign-designer";
import { AutosaveIndicator, RestoreDraftBar } from "./campaign/autosave";

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

type AudienceFilters = { markets: string[]; company: string; country: string; status: string; search: string };

const EMPTY_AUDIENCE: AudienceFilters = { markets: [], company: "", country: "", status: "", search: "" };

/** Editor state → wire shape. Empty values are dropped, never sent as "". */
function audienceToFilters(f: AudienceFilters): BulkEmailFilters {
  const out: BulkEmailFilters = {};
  if (f.markets.length) out.markets = f.markets;
  if (f.company)        out.company = f.company;
  if (f.country)        out.country = f.country;
  if (f.status)         out.status  = f.status as BulkEmailFilters["status"];
  if (f.search)         out.search  = f.search;
  return out;
}

/** Wire shape → editor state, for restoring a draft. Accepts the older single `market` too. */
function filtersToAudience(f: BulkEmailFilters | null | undefined): AudienceFilters {
  if (!f) return EMPTY_AUDIENCE;
  return {
    markets: f.markets ?? (f.market ? [f.market] : []),
    company: f.company ?? "",
    country: f.country ?? "",
    status:  f.status  ?? "",
    search:  f.search  ?? "",
  };
}

function AudienceFiltersCard({
  filters, onChange, count, countLoading,
}: {
  filters: AudienceFilters;
  onChange: (f: AudienceFilters) => void;
  count: number | null;
  countLoading: boolean;
}) {
  const { markets } = useMarketOptions();
  const hasFilter =
    filters.markets.length > 0 || filters.company || filters.country || filters.status || filters.search;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[0.83rem] font-semibold text-[#171a20]">
        <Filter size={14} className="text-[#5c5e62]" />
        Audience (optional — blank = all non-unsubscribed contacts)
      </div>

      {/* Markets — the filter that actually matters for "who am I emailing,"
          kept first and separate from the rest. Multi-select: a contact in two
          of the chosen markets is selected exactly once, so nobody is emailed
          twice and the recipient count below is the real send size (never the
          sum of the per-market counts on the chips). */}
      <div>
        <label className="mb-1 block text-[0.78rem] font-semibold text-[#5c5e62]">
          Markets {filters.markets.length > 0 && `(${filters.markets.length} selected)`}
        </label>
        <MarketMultiSelect
          markets={markets}
          value={filters.markets}
          onChange={(m) => onChange({ ...filters, markets: m })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
          onClick={() => onChange(EMPTY_AUDIENCE)}
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

/**
 * Two authoring paths against the same send endpoint: blocks (what the
 * marketers can actually use) and raw HTML (unchanged, still works). Blocks
 * is the default — the HTML path exists for anyone who needs it and as the
 * fallback when the design schema isn't available.
 */
type AuthoringMode = "design" | "html";

function Composer({
  onSent,
  adminEmail,
  reopenFrom,
  onReopenConsumed,
}: {
  onSent: (id: number) => void;
  adminEmail: string;
  reopenFrom: BulkEmail | null;
  onReopenConsumed: () => void;
}) {
  const [mode, setMode]               = useState<AuthoringMode>("design");
  const [subject, setSubject]         = useState("");
  const [bodyHtml, setBodyHtml]       = useState("");
  const [blocks, setBlocks]           = useState<CampaignBlock[]>([]);
  const [theme, setTheme]             = useState("");
  // Colour overrides riding on top of the preset — an imported or saved design
  // brings its own palette. Kept beside `theme` rather than folded into it
  // because the picker's <select> needs a plain string value.
  const [themeOverrides, setThemeOverrides] = useState<CampaignThemeOverrides | null>(null);
  const [filters, setFilters]         = useState<AudienceFilters>(EMPTY_AUDIENCE);
  const [count, setCount]             = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [blockErrors, setBlockErrors] = useState<Record<number, string[]>>({});
  const [generalErrors, setGeneral]   = useState<string[]>([]);
  const [restorable, setRestorable]   = useState<CampaignDraft | null>(null);

  // ── Autosave ───────────────────────────────────────────────────────────────
  // The safety net, not the fix. The fix is that nothing in this composer
  // should require leaving the tab in the first place (see the media picker).
  const autosave = useCampaignAutosave({
    subject,
    blocks,
    theme,
    bodyHtml,
    filters: audienceToFilters(filters),
  });

  // "Restore your work?" — only offered when there is genuinely something to
  // restore. Backend returns data: null for an empty draft for exactly this
  // reason: a prompt that sometimes restores nothing gets dismissed reflexively.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch("/api/admin/campaign-drafts/latest");
        const json = await res.json().catch(() => null);
        const d: CampaignDraft | null = json?.data ?? null;
        if (cancelled || !d || !draftHasContent(d)) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, same pattern as cart-context.tsx
        setRestorable(d);
      } catch { /* nothing to restore is the normal case */ }
    })();
    return () => { cancelled = true; };
  }, []);

  async function restoreDraft(d: CampaignDraft) {
    // `/latest` returns the full record; only the *list* is the light shape.
    // The one case worth guarding is blocks missing while the draft says it
    // has some — restoring a designed campaign as an empty canvas would look
    // like the draft was lost, which is the failure this feature exists to stop.
    let full = d;
    if (!d.blocks && (d.block_count ?? 0) > 0) {
      try {
        const res  = await fetch(`/api/admin/campaign-drafts/${d.id}`);
        const json = await res.json().catch(() => null);
        const fetched: CampaignDraft | null = json?.data ?? null;
        if (fetched) full = fetched;
      } catch { /* fall back to what /latest gave us */ }
    }

    const audience  = filtersToAudience(full.filters);
    const themeKey  = themeToKey(full.theme);
    setSubject(full.subject ?? "");
    setBlocks(full.blocks ?? []);
    setTheme(themeKey);
    setThemeOverrides(themeOverridesOf(full.theme));
    setBodyHtml(full.body_html ?? "");
    setFilters(audience);
    setMode(full.blocks?.length ? "design" : full.body_html ? "html" : "design");
    setRestorable(null);
    setError(null);

    autosave.adopt(full, {
      subject: full.subject ?? "",
      blocks: full.blocks ?? [],
      theme: themeKey,
      bodyHtml: full.body_html ?? "",
      filters: audienceToFilters(audience),
    });
  }

  async function discardDraft(d: CampaignDraft) {
    setRestorable(null);
    await fetch(`/api/admin/campaign-drafts/${d.id}`, { method: "DELETE" }).catch(() => {});
  }

  // Reopen / Duplicate: load a past designed campaign back into the editor.
  useEffect(() => {
    if (!reopenFrom) return;
    setMode("design");
    setSubject(reopenFrom.subject ?? "");
    setBlocks(reopenFrom.blocks ?? []);
    // The campaigns endpoint returns `theme` as an object, so this cannot be
    // assigned straight to a string state — doing so put an object into the
    // colour <select>. Preset drives the picker, the rest ride as overrides.
    setTheme(themeToKey(reopenFrom.theme));
    setThemeOverrides(themeOverridesOf(reopenFrom.theme));
    setBodyHtml("");
    setError(null);
    setBlockErrors({});
    setGeneral([]);
    onReopenConsumed();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [reopenFrom, onReopenConsumed]);

  // Debounced recipient count fetch
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCountLoading(true);
      const qs = new URLSearchParams();
      for (const m of filters.markets) qs.append("markets", m);
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
    if (mode === "design") {
      if (blocks.length === 0) { setError("Add at least one block before sending."); return; }
    } else if (!bodyHtml.trim() || bodyHtml === "<p></p>") {
      setError("Email body is required."); return;
    }
    if (count === 0)     { setError("No matching recipients. Adjust the audience filters."); return; }

    setSending(true);
    setError(null);
    setBlockErrors({});
    setGeneral([]);

    // Build filters payload — only include non-empty values
    const filtersPayload = audienceToFilters(filters);

    const body: Record<string, unknown> = { subject: subject.trim() };
    if (mode === "design") {
      body.blocks = blocks;
      // An object, never a bare preset string: this endpoint validates `theme`
      // as an array, so a string 422s and the campaign cannot be sent at all
      // once a colour scheme has been chosen.
      const themePayload = themeToWire(theme, themeOverrides);
      if (themePayload) body.theme = themePayload;
    } else {
      body.body_html = bodyHtml;
    }
    if (Object.keys(filtersPayload).length > 0) body.filters = filtersPayload;

    // Retires the draft server-side — but only once the campaign is safely
    // queued, so a failed send never destroys the only copy of her work.
    const draftId = autosave.getDraftId();
    if (draftId) body.draft_id = draftId;

    try {
      const res = await fetch("/api/admin/bulk-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 422) {
        // Block validation is written for the marketer ("Block 2 (Button):
        // "Where it goes" is required."), so each message is attached to the
        // block it names rather than dumped in one list at the top.
        const blockMessages: unknown = json?.errors?.blocks;
        if (json?.code === "invalid_blocks" && Array.isArray(blockMessages)) {
          const { byIndex, general } = groupBlockErrors(blockMessages.map(String));
          setBlockErrors(byIndex);
          setGeneral(general);
          setError("Some blocks need attention — see the highlighted ones below.");
          return;
        }
        setError(json.message ?? "No matching recipients for those filters.");
        return;
      }
      if (!res.ok) {
        setError(json.error ?? json.message ?? `Send failed (${res.status}).`);
        return;
      }

      const campaign: BulkEmail = json.data ?? json;
      autosave.retire(); // queued — the draft has done its job
      setSubject("");
      setBodyHtml("");
      setBlocks([]);
      setTheme("");
      setFilters(EMPTY_AUDIENCE);
      onSent(campaign.id);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/[0.07] bg-white p-5 space-y-5">
      {restorable && (
        <RestoreDraftBar
          draft={restorable}
          onRestore={() => { void restoreDraft(restorable); }}
          onDiscard={() => { void discardDraft(restorable); }}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-[0.875rem] font-bold text-[#171a20]">New Campaign</h2>
        <div className="ml-auto flex items-center gap-0.5 rounded-full bg-[#f0f2f5] p-0.5">
          {([
            ["design", LayoutTemplate, "Design with blocks"],
            ["html", Code2, "Write HTML"],
          ] as const).map(([m, Icon, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className={[
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition",
                mode === m ? "bg-white text-[#171a20] shadow-sm" : "text-[#5c5e62] hover:text-[#171a20]",
              ].join(" ")}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject — merge tags work here too, so it's shared by both modes */}
      <div>
        <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#5c5e62]">Subject</label>
        <input
          type="text"
          placeholder="e.g. New tyre stock arriving — special pricing for our partners"
          value={subject}
          onChange={(e) => { setSubject(e.target.value); setError(null); }}
          className="h-10 w-full rounded-lg border border-black/[0.10] bg-white px-3 text-[0.875rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
        />
        <p className="mt-1 text-[0.72rem] text-[#8c8f94]">
          You can personalise this too — e.g. <span className="font-mono">[[FIRST_NAME|there]]</span>,
          a special offer for you.
        </p>
      </div>

      {/* Body */}
      {mode === "design" ? (
        <CampaignDesigner
          subject={subject}
          blocks={blocks}
          theme={theme}
          themeOverrides={themeOverrides}
          onThemeOverridesChange={setThemeOverrides}
          onBlocksChange={(b) => { setBlocks(b); setError(null); }}
          onThemeChange={setTheme}
          blockErrors={blockErrors}
          generalErrors={generalErrors}
          adminEmail={adminEmail}
        />
      ) : (
        <div>
          <label className="mb-1.5 block text-[0.78rem] font-semibold text-[#5c5e62]">Email body</label>
          <div className="min-h-[280px] rounded-xl border border-black/[0.10] overflow-hidden">
            <ArticleRichEditor value={bodyHtml} onChange={setBodyHtml} />
          </div>
          <p className="mt-1 text-[0.72rem] text-[#8c8f94]">
            An unsubscribe footer link is added automatically by the server — do not add one yourself.
          </p>
        </div>
      )}

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

      <div className="flex items-center justify-end gap-4">
        <AutosaveIndicator status={autosave.status} lastSavedAt={autosave.lastSavedAt} />
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

function CampaignHistory({
  refreshKey,
  onReopen,
}: {
  refreshKey: number;
  onReopen: (c: BulkEmail) => void;
}) {
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
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
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
            {/* A sandboxed iframe, not dangerouslySetInnerHTML into a div.
                `body_html` on a block-designed campaign is the *whole rendered
                email document* — the backend renders blocks at send time and
                stores the result here — so injecting it into a div drops the
                <head>, and with it the <style> block that carries every media
                query. The sent campaign would render here unstyled and get
                reported as a broken email. It also let a sent document restyle
                the admin page around it, which is the reason the live preview
                has always used an iframe. */}
            {preview.body_html ? (
              <iframe
                title={`Sent campaign: ${preview.subject}`}
                srcDoc={preview.body_html}
                sandbox=""
                className="block w-full border-0 bg-white"
                style={{ height: "70vh" }}
              />
            ) : (
              <p className="p-5 text-[0.875rem] text-[#5c5e62]">No body content.</p>
            )}
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
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {/* Only designed campaigns can be reopened — an HTML one
                          has no blocks to load back into the editor. */}
                      {c.designed && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await fetch(`/api/admin/bulk-emails/${c.id}`);
                            const json = await res.json().catch(() => null);
                            const full: BulkEmail | null = json ? (json.data ?? json) : null;
                            if (full?.blocks?.length) onReopen(full);
                          }}
                          title="Duplicate into a new campaign"
                          className="mr-1 rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20]"
                        >
                          <CopyPlus size={14} />
                        </button>
                      )}
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

export default function BulkEmailPanel({ adminEmail = "" }: { adminEmail?: string }) {
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [historyKey, setHistoryKey]             = useState(0);
  const [reopenFrom, setReopenFrom]             = useState<BulkEmail | null>(null);

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
      <Composer
        onSent={handleSent}
        adminEmail={adminEmail}
        reopenFrom={reopenFrom}
        onReopenConsumed={() => setReopenFrom(null)}
      />

      {/* History */}
      <CampaignHistory refreshKey={historyKey} onReopen={setReopenFrom} />
    </div>
  );
}
