"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import {
  Upload, Search, Trash2, Users, CheckCircle2, XCircle, Plus, Pencil,
  HelpCircle, AlertTriangle, RefreshCw, FileText, X, ChevronLeft, ChevronRight,
  ArrowRightLeft, Info, MinusCircle, Globe,
} from "lucide-react";
import type {
  MarketingContact, MarketingContactStats, MarketingContactImportResult,
  MarketingContactMarketOp, MarketingContactMarketResult,
  MarketingContactMarketSelector, MarketingContactExistsError,
} from "@/lib/admin-api";
import { MarketSelect, useMarketOptions, label as marketLabel, type MarketOption } from "./market-select";

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  subscribed:   "Subscribed",
  unsubscribed: "Unsubscribed",
  unknown:      "Unknown",
};

const STATUS_BADGE: Record<string, string> = {
  subscribed:   "bg-emerald-100 text-emerald-700",
  unsubscribed: "bg-gray-100 text-gray-500",
  unknown:      "bg-amber-100 text-amber-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── Stats cards ───────────────────────────────────────────────────────────────

function StatsCards({ stats, loading }: { stats: MarketingContactStats | null; loading: boolean }) {
  const cards = [
    { label: "Total", value: stats?.total ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Subscribed", value: stats?.subscribed ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Unknown", value: stats?.unknown ?? 0, icon: HelpCircle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Unsubscribed", value: stats?.unsubscribed ?? 0, icon: XCircle, color: "text-gray-500", bg: "bg-gray-100" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="rounded-xl border border-black/[0.07] bg-white p-4">
          <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${bg}`}>
            <Icon size={16} className={color} />
          </div>
          <p className="text-[1.4rem] font-extrabold text-[#171a20]">
            {loading ? "—" : value.toLocaleString()}
          </p>
          <p className="text-[0.75rem] text-[#5c5e62]">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Market operations (add / move / remove) ───────────────────────────────────

/**
 * A contact can belong to several markets at once. The three operations take
 * the same OR'd selectors, so one UI selection drives any of them — a single
 * call shape serves every entry point (add-form conflict, chip ✕/+, row menu,
 * bulk toolbar, whole-market management).
 */
async function marketOp(
  op: MarketingContactMarketOp,
  body: Record<string, unknown>,
): Promise<{ ok: true; result: MarketingContactMarketResult } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/admin/marketing-contacts/${op}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: json.error ?? json.message ?? `Operation failed (${res.status}).` };
    }
    return { ok: true, result: json.data ?? json };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

const OP_COPY: Record<MarketingContactMarketOp, {
  verb: string; gerund: string; label: string; icon: typeof Plus;
}> = {
  "add-to-market":      { verb: "Add",    gerund: "Adding…",   label: "Add to market *",      icon: Plus },
  "move-market":        { verb: "Move",   gerund: "Moving…",   label: "Move to market *",     icon: ArrowRightLeft },
  "remove-from-market": { verb: "Remove", gerund: "Removing…", label: "Remove from market *", icon: MinusCircle },
};

type MarketOpRequest = {
  op: MarketingContactMarketOp;
  title: string;
  description: string;
  selector: MarketingContactMarketSelector;
  /** Pre-chosen market — skips the picker (chip ✕, "clear this market"). */
  fixedMarket?: string;
  /** Hidden from the picker: adding/moving somewhere they already are is a no-op. */
  excludeMarkets?: string[];
  /** For remove: only these markets are offerable. */
  limitToMarkets?: string[];
  /** Cleanup owned by the caller (clearing a selection, resetting a filter). */
  onDone?: (result: MarketingContactMarketResult) => void;
};

function MarketOpModal({
  request,
  markets,
  onClose,
  onApplied,
}: {
  request: MarketOpRequest;
  markets: MarketOption[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const copy = OP_COPY[request.op];
  const isRemove = request.op === "remove-from-market";

  const [market, setMarket] = useState(request.fixedMarket ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [result, setResult] = useState<MarketingContactMarketResult | null>(null);

  // Removal can only target a market the contact is actually in; add/move keep
  // the free-text "+ New market" path, because a market doesn't exist until a
  // contact is in it — a list of existing options could never create the first.
  const options = request.limitToMarkets
    ? request.limitToMarkets.map((m) => markets.find((x) => x.market === m) ?? { market: m, contact_count: 0 })
    : markets.filter((m) => !(request.excludeMarkets ?? []).includes(m.market));

  async function handleApply() {
    if (!market.trim()) {
      setError(isRemove ? "Choose the market to leave." : "Choose (or type) a market.");
      return;
    }
    setSaving(true);
    setError(null);

    // remove-from-market names its market `market`; add/move use `to_market`.
    const body: Record<string, unknown> = isRemove
      ? { ...request.selector, market: market.trim() }
      : { ...request.selector, to_market: market.trim() };

    const res = await marketOp(request.op, body);
    setSaving(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(res.result);
    request.onDone?.(res.result);
    onApplied();
  }

  const skippedLast = result?.skipped_last_market ?? [];
  const notFound    = result?.not_found ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="font-bold text-[#171a20]">{request.title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#5c5e62] hover:bg-[#f0f2f5]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {result ? (
            <MarketOpResult result={result} op={request.op} notFound={notFound} skippedLast={skippedLast} />
          ) : (
            <>
              <p className="text-[0.83rem] text-[#5c5e62]">{request.description}</p>
              {request.fixedMarket ? (
                <p className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-[0.83rem] font-semibold capitalize text-[#171a20]">
                  {request.fixedMarket}
                </p>
              ) : (
                <div>
                  <label className="mb-1 block text-[0.78rem] font-semibold text-[#5c5e62]">{copy.label}</label>
                  <MarketSelect
                    markets={options}
                    value={market}
                    onChange={setMarket}
                    mode={isRemove ? "filter" : "create"}
                    allLabel="Select market…"
                  />
                </div>
              )}
              <p className="flex items-start gap-1.5 text-[0.72rem] text-[#5c5e62]">
                <Info size={12} className="mt-0.5 shrink-0" />
                {isRemove
                  ? "The contact isn't deleted — it just leaves this market. A contact always keeps at least one."
                  : "Nothing is created or deleted, and unsubscribed contacts keep their status."}
              </p>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[0.83rem] text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[0.83rem] font-semibold text-[#5c5e62] hover:bg-[#f0f2f5]"
          >
            {result ? "Done" : "Cancel"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleApply}
              disabled={saving || !market.trim()}
              className={[
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.83rem] font-semibold text-white transition disabled:opacity-60",
                isRemove ? "bg-red-600 hover:bg-red-700" : "bg-[#f4511e] hover:bg-[#df4618]",
              ].join(" ")}
            >
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <copy.icon size={12} />}
              {saving ? copy.gerund : copy.verb}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketOpResult({
  result, op, notFound, skippedLast,
}: {
  result: MarketingContactMarketResult;
  op: MarketingContactMarketOp;
  notFound: string[];
  skippedLast: string[];
}) {
  // "removed: 0 + skipped_last_market" is a complete no-op, not a partial
  // success — saying "Removed" above it would read as though something changed.
  const nothingHappened =
    op === "remove-from-market" && (result.removed ?? 0) === 0 && skippedLast.length > 0;

  const counts: Array<[string, number]> = [
    ...(result.added   !== undefined ? [["Added",   result.added]   as [string, number]] : []),
    ...(result.moved   !== undefined ? [["Moved",   result.moved]   as [string, number]] : []),
    ...(result.removed !== undefined ? [["Removed", result.removed] as [string, number]] : []),
    ...(result.already_in_place !== undefined
      ? [["Already there", result.already_in_place] as [string, number]] : []),
  ];

  return (
    <div
      className={[
        "space-y-1.5 rounded-xl border p-4 text-[0.83rem]",
        nothingHappened ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50",
      ].join(" ")}
    >
      <p className={`font-bold ${nothingHappened ? "text-amber-800" : "text-emerald-800"}`}>
        {nothingHappened
          ? "Nothing changed"
          : <>Done — <span className="capitalize">{result.to_market ?? result.market}</span></>}
      </p>
      {counts.length > 0 && (
        <div className={`grid grid-cols-2 gap-x-6 gap-y-0.5 ${nothingHappened ? "text-amber-700" : "text-emerald-700"}`}>
          {counts.map(([k, v]) => (
            <Fragment key={k}>
              <span>{k}</span><span className="font-semibold">{v.toLocaleString()}</span>
            </Fragment>
          ))}
        </div>
      )}

      {skippedLast.length > 0 && (
        <div className="mt-2 rounded-lg bg-amber-100/70 p-2 text-amber-800">
          <p className="font-semibold">Kept — this was their only market ({skippedLast.length})</p>
          <p className="mt-0.5 text-[0.78rem]">
            A contact always belongs to at least one market. To take these out, move them to another
            market instead, or delete the contact.
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {skippedLast.slice(0, 5).map((e) => <li key={e}>{e}</li>)}
            {skippedLast.length > 5 && <li>…and {skippedLast.length - 5} more</li>}
          </ul>
        </div>
      )}

      {notFound.length > 0 && (
        <div className="mt-2 rounded-lg bg-amber-100/70 p-2 text-amber-800">
          <p className="font-semibold">Not on the list ({notFound.length})</p>
          <p className="mt-0.5 text-[0.78rem]">
            Nothing was created for these — a market operation never imports a new address.
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {notFound.slice(0, 5).map((e) => <li key={e}>{e}</li>)}
            {notFound.length > 5 && <li>…and {notFound.length - 5} more</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Every market a contact belongs to, tolerating a backend still on one. */
function contactMarkets(c: MarketingContact): string[] {
  if (c.markets && c.markets.length > 0) return c.markets;
  return c.market ? [c.market] : [];
}

// ── Market management ─────────────────────────────────────────────────────────

/**
 * Per-market cleanup — the path for retiring a leftover test market. There is
 * no delete-market endpoint and none is needed: markets are derived from live
 * contact data, so one with no contacts left stops existing on its own.
 */
function MarketManager({
  markets,
  onOp,
  contactTotal,
}: {
  markets: MarketOption[];
  onOp: (op: MarketingContactMarketOp, m: MarketOption) => void;
  contactTotal: number | null;
}) {
  const sum = markets.reduce((acc, m) => acc + m.contact_count, 0);
  // Per-market counts each count a contact once, so a contact in two markets
  // is counted under both — the sum legitimately exceeds the contact total and
  // is not a number to present as one.
  const overlaps = contactTotal !== null && sum > contactTotal;

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.07] bg-white">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#f5f5f5] px-4 py-2.5">
        <Globe size={14} className="text-[#5c5e62]" />
        <h2 className="text-[0.83rem] font-bold text-[#171a20]">Markets</h2>
        <span className="ml-auto text-[0.72rem] text-[#5c5e62]">
          {markets.length} market{markets.length === 1 ? "" : "s"}
          {overlaps && ` · ${sum.toLocaleString()} memberships across ${contactTotal.toLocaleString()} contacts`}
        </span>
      </div>

      {markets.length === 0 ? (
        <p className="px-4 py-8 text-center text-[0.83rem] text-[#5c5e62]">
          No markets yet — import a CSV or add a contact.
        </p>
      ) : (
        <ul className="divide-y divide-black/[0.04]">
          {markets.map((m) => (
            <li key={m.market} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="text-[0.83rem] font-semibold capitalize text-[#171a20]">{m.market}</span>
              <span className="text-[0.78rem] text-[#5c5e62]">
                {m.contact_count.toLocaleString()} contact{m.contact_count === 1 ? "" : "s"}
              </span>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOp("add-to-market", m)}
                  className="flex items-center gap-1 rounded-full bg-[#f0f2f5] px-3 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-[#e5e7eb] hover:text-[#171a20]"
                >
                  <Plus size={12} /> Add all to…
                </button>
                <button
                  type="button"
                  onClick={() => onOp("move-market", m)}
                  className="flex items-center gap-1 rounded-full bg-[#f0f2f5] px-3 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-[#e5e7eb] hover:text-[#171a20]"
                >
                  <ArrowRightLeft size={12} /> Move all to…
                </button>
                <button
                  type="button"
                  onClick={() => onOp("remove-from-market", m)}
                  className="flex items-center gap-1 rounded-full bg-[#f0f2f5] px-3 py-1.5 text-[0.75rem] font-semibold text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600"
                >
                  <MinusCircle size={12} /> Clear
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-1.5 border-t border-black/[0.06] px-4 py-2.5 text-[0.72rem] text-[#5c5e62]">
        <Info size={12} className="mt-0.5 shrink-0" />
        A market with no contacts left disappears by itself. <strong className="font-semibold">Move all</strong> to
        a brand-new name renames a market; <strong className="font-semibold">Clear</strong> empties it without
        deleting anyone — a contact whose only market this is keeps it.
      </p>
    </div>
  );
}

// ── Import card ───────────────────────────────────────────────────────────────

function ImportCard({
  markets,
  onImported,
}: {
  markets: MarketOption[];
  onImported: () => void;
}) {
  const inputRef      = useRef<HTMLInputElement>(null);
  const [file, setFile]             = useState<File | null>(null);
  const [market, setMarket]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<MarketingContactImportResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [dragging, setDragging]     = useState(false);

  /**
   * Markets applied by the import, de-duplicated before anything is said about
   * them.
   *
   * Backend fixed a duplicate at source (`cd595d9` — importing the Wix export
   * *into* the `wix` market returned `["wix","wix"]`) and now asserts both the
   * uniqueness and the first-position ordering by test. This is kept anyway
   * because it is not a guess about data: rendering the same market twice
   * produces the sentence "imported into wix and also added to Wix", which is
   * false on its face, and one `Set` makes that unsayable rather than
   * unlikely. Deliberately unlike the market-normalisation gap, where a
   * client-side fix *would* have been a guess about what two differently-cased
   * values mean and was left alone.
   *
   * Deduping before the length check also means a duplicate makes the panel
   * fall silent — which is the correct outcome, since one market is nothing to
   * explain.
   */
  const appliedMarkets = [...new Set(result?.markets_applied ?? [])];

  function pickFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "txt") {
      setError("Please upload a CSV or TXT file.");
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  }

  async function handleUpload() {
    if (!file) return;
    if (!market.trim()) {
      setError("Select (or create) a market before importing.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("market", market.trim());

    try {
      const res = await fetch("/api/admin/marketing-contacts", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? json.message ?? `Upload failed (${res.status}).`);
      } else {
        setResult(json as MarketingContactImportResult);
        setFile(null);
        onImported();
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-black/[0.07] bg-white p-5">
      <h2 className="mb-3 text-[0.875rem] font-bold text-[#171a20]">Import Contacts</h2>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) pickFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition",
          dragging ? "border-[#f4511e] bg-orange-50" : "border-black/10 bg-[#f5f5f5] hover:border-[#f4511e]/50 hover:bg-orange-50/30",
        ].join(" ")}
      >
        <Upload size={24} className="text-[#5c5e62]" />
        <p className="text-[0.83rem] font-medium text-[#171a20]">
          {file ? file.name : "Drop CSV / TXT file here or click to browse"}
        </p>
        <p className="text-[0.72rem] text-[#5c5e62]">Wix export format · max 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-[0.78rem] font-semibold text-[#5c5e62]">
          Market — every imported contact is tagged with this
        </label>
        <MarketSelect markets={markets} value={market} onChange={setMarket} mode="create" />
        {/* Behaviour change: a re-import used to overwrite an existing
            contact's market, silently relocating anyone caught in an
            overlapping list. It now adds this market alongside what they
            already have — worth stating, since the old copy said the opposite. */}
        <p className="mt-1.5 flex items-start gap-1.5 text-[0.72rem] text-[#5c5e62]">
          <Info size={12} className="mt-0.5 shrink-0" />
          Contacts already on the list <strong className="font-semibold">keep their existing markets</strong> and
          gain this one as well. Nothing is duplicated, moved, or removed.
        </p>
      </div>

      {file && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[0.83rem] text-[#171a20]">
            <FileText size={14} className="text-[#5c5e62]" />
            <span className="truncate">{file.name}</span>
            <span className="text-[#5c5e62]">({(file.size / 1024).toFixed(0)} KB)</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="rounded-lg p-1 text-[#5c5e62] hover:bg-[#f0f2f5] hover:text-[#171a20]"
            >
              <X size={14} />
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading || !market.trim()}
              className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
              {loading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[0.83rem] text-red-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[0.83rem]">
          <p className="font-bold text-emerald-800">Import complete</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-emerald-700">
            <span>Imported</span><span className="font-semibold">{result.imported.toLocaleString()}</span>
            <span>Updated</span><span className="font-semibold">{result.updated.toLocaleString()}</span>
            <span>Skipped (no email)</span><span className="font-semibold">{result.skipped_no_email.toLocaleString()}</span>
            <span>Subscribed</span><span className="font-semibold">{result.subscribed.toLocaleString()}</span>
            <span>Unsubscribed</span><span className="font-semibold">{result.unsubscribed.toLocaleString()}</span>
          </div>
          {/*
            An extra market the operator didn't pick.

            Without this the screen says "1,720 imported" and a market nobody
            asked for appears in the list, which reads as something having gone
            wrong. Two things have to be said, not just one: the contacts did
            not *move* — the chosen market is still primary and a row showing
            only the primary looks unchanged, which is correct — and a source
            market is not a place, so a campaign addressed to it reaches people
            in every country.
          */}
          {appliedMarkets.length > 1 && (
            <div className="mt-2 rounded-lg border border-emerald-300 bg-white p-2.5 text-emerald-800">
              <p className="font-semibold">
                {result.source_detected
                  ? `Recognised as a ${marketLabel(result.source_detected)} export`
                  : "Added to more than one market"}
              </p>
              <p className="mt-0.5 leading-snug">
                Imported into{" "}
                <strong className="font-semibold">{marketLabel(appliedMarkets[0])}</strong>
                {" — still their market — and also added to "}
                {appliedMarkets.slice(1).map((m, i, arr) => (
                  <Fragment key={m}>
                    <strong className="font-semibold">{marketLabel(m)}</strong>
                    {i < arr.length - 2 ? ", " : i === arr.length - 2 ? " and " : ""}
                  </Fragment>
                ))}
                .
              </p>
              <p className="mt-1 text-[0.78rem] leading-snug text-emerald-700">
                Nothing was moved. {marketLabel(appliedMarkets[0])}
                {" is still each contact\u2019s primary market, so their rows look unchanged."}
                {result.source_detected && (
                  <>
                    {" "}
                    <strong className="font-semibold">
                      {marketLabel(result.source_detected)}
                    </strong>{" "}
                    is where they came from, not where they are — a campaign sent to it
                    reaches people in every country.
                  </>
                )}
              </p>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-700">
              <p className="font-semibold">Warnings ({result.errors.length})</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                {result.errors.length > 5 && <li>…and {result.errors.length - 5} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add / edit contact modal ──────────────────────────────────────────────────

type ContactFormValues = {
  email: string;
  market: string;
  first_name: string;
  last_name: string;
  company: string;
  country: string;
  phone: string;
};

function ContactModal({
  contact,
  markets,
  onClose,
  onSaved,
}: {
  /** undefined = create; provided = edit */
  contact?: MarketingContact;
  markets: MarketOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!contact;
  const [values, setValues] = useState<ContactFormValues>({
    email: contact?.email ?? "",
    market: contact?.market ?? "",
    first_name: contact?.first_name ?? "",
    last_name: contact?.last_name ?? "",
    company: contact?.company ?? "",
    country: contact?.country ?? "",
    phone: contact?.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when the backend answers 422 `contact_exists`. The address is already
  // on the list, so the two real next steps are "add this market alongside" or
  // "relocate it" — a bare "email already taken" field error is what left the
  // marketer deleting the contact first, which is what she reported.
  const [conflict, setConflict] = useState<MarketingContactExistsError["data"] | null>(null);
  const [resolving, setResolving] = useState<MarketingContactMarketOp | null>(null);

  function set<K extends keyof ContactFormValues>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
    setConflict(null);
  }

  function isExistsError(json: unknown): json is MarketingContactExistsError {
    return (
      typeof json === "object" && json !== null &&
      (json as { code?: unknown }).code === "contact_exists" &&
      typeof (json as { data?: unknown }).data === "object" &&
      (json as { data: unknown }).data !== null
    );
  }

  async function handleResolveConflict(op: MarketingContactMarketOp) {
    if (!conflict) return;
    setResolving(op);
    setError(null);

    const res = await marketOp(op, {
      contact_ids: [conflict.existing_contact.id],
      to_market: conflict.target_market,
    });
    setResolving(null);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    onSaved();
    onClose();
  }

  async function handleSave() {
    if (!values.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!isEdit && !values.market.trim()) {
      setError("Market is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setConflict(null);

    // Editing never touches market membership — omitting the field entirely is
    // what guarantees that, since a sent value would replace the whole set.
    const body: Record<string, string> = { email: values.email.trim() };
    if (!isEdit) body.market = values.market.trim();
    if (values.first_name) body.first_name = values.first_name;
    if (values.last_name) body.last_name = values.last_name;
    if (values.company) body.company = values.company;
    if (values.country) body.country = values.country;
    if (values.phone) body.phone = values.phone;

    try {
      const url = isEdit ? `/api/admin/marketing-contacts/${contact!.id}` : "/api/admin/marketing-contacts";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // With neither flag there is no next step to offer (it's already in the
        // market that was asked for), so the plain field error is right.
        if (isExistsError(json) && (json.data.can_add_market || json.data.can_move)) {
          setConflict(json.data);
          return;
        }
        setError(json.error ?? json.message ?? `Could not save (${res.status}).`);
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "h-9 w-full rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none";
  const labelClass = "mb-1 block text-[0.78rem] font-semibold text-[#5c5e62]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
          <h2 className="font-bold text-[#171a20]">{isEdit ? "Edit contact" : "Add contact"}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#5c5e62] hover:bg-[#f0f2f5]">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <label className={labelClass}>Email *</label>
            <input
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputClass}
            />
          </div>
          {/* Membership is managed by the chips on the contact row, not here —
              a single-value field can't represent a contact in three markets,
              and PATCHing `markets` from it would silently drop the rest. */}
          {isEdit ? (
            <div>
              <label className={labelClass}>Markets</label>
              <div className="flex flex-wrap items-center gap-1.5">
                {contactMarkets(contact!).map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-[#f0f2f5] px-2.5 py-1 text-[0.75rem] font-semibold capitalize text-[#5c5e62]"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-[0.72rem] text-[#8c8f94]">
                Add or remove markets from the contact row — this form leaves them untouched.
              </p>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Market *</label>
              <MarketSelect markets={markets} value={values.market} onChange={(m) => set("market", m)} mode="create" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First name</label>
              <input value={values.first_name} onChange={(e) => set("first_name", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input value={values.last_name} onChange={(e) => set("last_name", e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input value={values.company} onChange={(e) => set("company", e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Country</label>
              <input value={values.country} onChange={(e) => set("country", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={values.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass} />
            </div>
          </div>

          {conflict && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[0.83rem] text-amber-800">
              <p>
                <strong className="font-semibold">{conflict.existing_contact.email}</strong> is already
                in {conflict.existing_markets.length > 0
                  ? conflict.existing_markets.map(marketLabel).join(", ")
                  : marketLabel(conflict.existing_contact.market ?? "—")}.
              </p>
              <p className="text-[0.75rem]">
                A contact can belong to several markets, so you can keep what it has and add{" "}
                <span className="capitalize">{conflict.target_market}</span> alongside — or relocate it.
                Either way no duplicate is created and its subscription status is untouched.
              </p>
              <div className="flex flex-wrap gap-2">
                {conflict.can_add_market && (
                  <button
                    type="button"
                    onClick={() => handleResolveConflict("add-to-market")}
                    disabled={resolving !== null}
                    className="flex items-center gap-1.5 rounded-full bg-amber-600 px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                  >
                    {resolving === "add-to-market"
                      ? <RefreshCw size={12} className="animate-spin" />
                      : <Plus size={12} />}
                    Add to <span className="capitalize">{conflict.target_market}</span> too
                  </button>
                )}
                {conflict.can_move && (
                  <button
                    type="button"
                    onClick={() => handleResolveConflict("move-market")}
                    disabled={resolving !== null}
                    className="flex items-center gap-1.5 rounded-full border border-amber-600 px-3.5 py-1.5 text-[0.78rem] font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                  >
                    {resolving === "move-market"
                      ? <RefreshCw size={12} className="animate-spin" />
                      : <ArrowRightLeft size={12} />}
                    Move to <span className="capitalize">{conflict.target_market}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-[0.83rem] text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[0.83rem] font-semibold text-[#5c5e62] hover:bg-[#f0f2f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || resolving !== null}
            className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-2 text-[0.83rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60"
          >
            {saving ? <RefreshCw size={12} className="animate-spin" /> : null}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Contacts table ────────────────────────────────────────────────────────────

type Filters = {
  status: string;
  company: string;
  country: string;
  market: string;
  search: string;
};

export default function MarketingContactsPanel() {
  const [stats, setStats]         = useState<MarketingContactStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [contacts, setContacts]   = useState<MarketingContact[]>([]);
  const [meta, setMeta]           = useState({ total: 0, current_page: 1, last_page: 1 });
  const [tableLoading, setTableLoading] = useState(true);

  const [filters, setFilters]     = useState<Filters>({ status: "", company: "", country: "", market: "", search: "" });
  const [page, setPage]           = useState(1);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { markets, refresh: refreshMarkets } = useMarketOptions();
  const [modalContact, setModalContact] = useState<MarketingContact | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selected, setSelected] = useState<number[]>([]);
  const [opRequest, setOpRequest] = useState<MarketOpRequest | null>(null);
  const [showMarketManager, setShowMarketManager] = useState(false);

  // ── Data fetchers ────────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/marketing-contacts/stats");
      const json = await res.json().catch(() => null);
      if (json) setStats(json);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchContacts = useCallback(async (f: Filters, p: number) => {
    setTableLoading(true);
    const qs = new URLSearchParams({ page: String(p), per_page: "25" });
    if (f.status)  qs.set("status",  f.status);
    if (f.company) qs.set("company", f.company);
    if (f.country) qs.set("country", f.country);
    if (f.market)  qs.set("market",  f.market);
    if (f.search)  qs.set("search",  f.search);

    try {
      const res = await fetch(`/api/admin/marketing-contacts?${qs.toString()}`);
      const json = await res.json().catch(() => ({ data: [], meta: {} }));
      setContacts(json.data ?? []);
      setMeta({
        total: json.meta?.total ?? 0,
        current_page: json.meta?.current_page ?? 1,
        last_page: json.meta?.last_page ?? 1,
      });
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchContacts(filters, page); }, [fetchContacts, filters, page]);

  /**
   * Counts change on every move and an emptied market vanishes from /markets
   * entirely (that list is derived from live data), so all three always refresh
   * together rather than leaving a stale tab pointing at nothing.
   */
  const refreshAll = useCallback(() => {
    fetchStats();
    fetchContacts(filters, page);
    refreshMarkets();
  }, [fetchStats, fetchContacts, refreshMarkets, filters, page]);

  function applyFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setSelected([]);
  }

  const pageIds = contacts.map((c) => c.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

  function toggleOne(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAllOnPage() {
    setSelected((prev) =>
      allOnPageSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])],
    );
  }

  // ── Market operation entry points ───────────────────────────────────────────

  const plural = (n: number) => `${n.toLocaleString()} contact${n === 1 ? "" : "s"}`;

  /** Bulk toolbar — one selection drives all three operations. */
  function requestBulkOp(op: MarketingContactMarketOp) {
    const n = selected.length;
    setOpRequest({
      op,
      title: `${OP_COPY[op].verb} ${plural(n)}`,
      description:
        op === "add-to-market"
          ? `${plural(n)} will gain the market you choose, keeping the markets they already have.`
          : op === "move-market"
          ? `${plural(n)} will be relocated to the market you choose, replacing their current markets.`
          : `${plural(n)} will leave the market you choose. They aren't deleted, and any contact for which this is the only market keeps it.`,
      selector: { contact_ids: selected },
      // Removal can only target markets present in the selection.
      limitToMarkets: op === "remove-from-market"
        ? [...new Set(contacts.filter((c) => selected.includes(c.id)).flatMap(contactMarkets))]
        : undefined,
      onDone: () => setSelected([]),
    });
  }

  /** Chip "+" — add one contact to another market. */
  function requestChipAdd(c: MarketingContact) {
    setOpRequest({
      op: "add-to-market",
      title: "Add to another market",
      description: `${c.email} keeps ${contactMarkets(c).map(marketLabel).join(", ") || "its markets"} and gains the one you choose.`,
      selector: { contact_ids: [c.id] },
      excludeMarkets: contactMarkets(c),
    });
  }

  /** Chip "✕" — leave one named market, no picker needed. */
  function requestChipRemove(c: MarketingContact, market: string) {
    const only = contactMarkets(c).length <= 1;
    setOpRequest({
      op: "remove-from-market",
      title: `Remove from ${marketLabel(market)}`,
      description: only
        ? `${market} is the only market ${c.email} belongs to. A contact always keeps at least one, so this will be refused — move it to another market first, or delete the contact.`
        : `${c.email} leaves ${marketLabel(market)} and keeps its other markets. The contact itself isn't deleted.`,
      selector: { contact_ids: [c.id] },
      fixedMarket: market,
    });
  }

  /** Market management row — move-all / add-all / clear. */
  function requestMarketOp(op: MarketingContactMarketOp, m: MarketOption) {
    const disappears =
      "An emptied market disappears from the list on its own — markets are derived from live contact data, so there's nothing to delete.";
    setOpRequest({
      op,
      title:
        op === "move-market"   ? `Move everyone out of ${marketLabel(m.market)}`
        : op === "add-to-market" ? `Also add ${marketLabel(m.market)}'s contacts to…`
        : `Clear the ${marketLabel(m.market)} market`,
      description:
        op === "move-market"
          ? `All ${plural(m.contact_count)} in ${marketLabel(m.market)} move to the market you choose, leaving it. Choosing a new name renames the market. ${disappears}`
        : op === "add-to-market"
          ? `All ${plural(m.contact_count)} in ${marketLabel(m.market)} also join the market you choose. They stay in ${marketLabel(m.market)} as well.`
          : `Every contact leaves ${marketLabel(m.market)} without being deleted. Anyone for whom it's their only market keeps it and is reported back. ${disappears}`,
      selector: op === "remove-from-market" ? {} : { from_market: m.market },
      fixedMarket: op === "remove-from-market" ? m.market : undefined,
      excludeMarkets: [m.market],
      onDone: () => {
        setSelected([]);
        // The active tab may now point at a market that no longer exists.
        if (filters.market === m.market) applyFilter("market", "");
      },
    });
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this contact from the marketing list?")) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/marketing-contacts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setDeleteError(json.error ?? json.message ?? "Could not remove contact.");
      } else {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        fetchStats();
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">

      {/* Stats */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Import */}
      <ImportCard markets={markets} onImported={refreshAll} />

      {/* Market tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => applyFilter("market", "")}
          className={[
            "rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition",
            filters.market === "" ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]",
          ].join(" ")}
        >
          All markets
        </button>
        {markets.map((m) => (
          <button
            key={m.market}
            type="button"
            onClick={() => applyFilter("market", m.market)}
            className={[
              "rounded-full px-3 py-1.5 text-[0.78rem] font-semibold capitalize transition",
              filters.market === m.market ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]",
            ].join(" ")}
          >
            {m.market} ({m.contact_count})
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowMarketManager((v) => !v)}
            className={[
              "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition",
              showMarketManager ? "bg-[#171a20] text-white" : "bg-[#f0f2f5] text-[#5c5e62] hover:bg-[#e5e7eb]",
            ].join(" ")}
          >
            <Globe size={14} /> Manage markets
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618]"
          >
            <Plus size={14} /> Add contact
          </button>
        </div>
      </div>

      {showMarketManager && (
        <MarketManager markets={markets} onOp={requestMarketOp} contactTotal={stats?.total ?? null} />
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5c5e62]" />
          <input
            type="text"
            placeholder="Search name, email, company…"
            value={filters.search}
            onChange={(e) => applyFilter("search", e.target.value)}
            className="h-9 w-full rounded-lg border border-black/[0.10] bg-white pl-8 pr-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => applyFilter("status", e.target.value)}
          className="h-9 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] focus:border-[#f4511e] focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="subscribed">Subscribed</option>
          <option value="unknown">Unknown</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <input
          type="text"
          placeholder="Company"
          value={filters.company}
          onChange={(e) => applyFilter("company", e.target.value)}
          className="h-9 w-36 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
        />
        <input
          type="text"
          placeholder="Country (DE, FR…)"
          value={filters.country}
          onChange={(e) => applyFilter("country", e.target.value)}
          className="h-9 w-36 rounded-lg border border-black/[0.10] bg-white px-3 text-[0.83rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#f4511e] focus:outline-none"
        />
        {(filters.status || filters.company || filters.country || filters.market || filters.search) && (
          <button
            type="button"
            onClick={() => { setFilters({ status: "", company: "", country: "", market: "", search: "" }); setPage(1); }}
            className="flex items-center gap-1 text-[0.78rem] text-[#5c5e62] hover:text-[#171a20]"
          >
            <X size={12} /> Clear
          </button>
        )}
        <span className="ml-auto text-[0.78rem] text-[#5c5e62]">
          {meta.total.toLocaleString()} contacts
        </span>
      </div>

      {deleteError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-[0.83rem] text-red-700">
          <AlertTriangle size={14} className="shrink-0" /> {deleteError}
        </div>
      )}

      {/* Bulk action bar — appears only with a live selection */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f4511e]/25 bg-orange-50 px-4 py-2.5">
          <span className="text-[0.83rem] font-semibold text-[#171a20]">
            {selected.length.toLocaleString()} selected
          </span>
          <button
            type="button"
            onClick={() => requestBulkOp("add-to-market")}
            className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-3.5 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618]"
          >
            <Plus size={12} /> Add to market…
          </button>
          <button
            type="button"
            onClick={() => requestBulkOp("move-market")}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.10] bg-white px-3.5 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:text-[#171a20]"
          >
            <ArrowRightLeft size={12} /> Move to market…
          </button>
          <button
            type="button"
            onClick={() => requestBulkOp("remove-from-market")}
            className="flex items-center gap-1.5 rounded-full border border-black/[0.10] bg-white px-3.5 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62] transition hover:border-red-200 hover:text-red-600"
          >
            <MinusCircle size={12} /> Remove from market…
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="ml-auto flex items-center gap-1 text-[0.78rem] text-[#5c5e62] hover:text-[#171a20]"
          >
            <X size={12} /> Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-black/[0.07] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#f5f5f5]">
                <th className="w-10 px-4 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAllOnPage}
                    disabled={pageIds.length === 0}
                    aria-label="Select all contacts on this page"
                    className="h-3.5 w-3.5 cursor-pointer accent-[#f4511e]"
                  />
                </th>
                {["Name", "Email", "Company", "Country", "Market", "Source", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[0.72rem] font-semibold uppercase tracking-wide text-[#5c5e62]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {tableLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[0.83rem] text-[#5c5e62]">
                    <RefreshCw size={16} className="mx-auto mb-2 animate-spin text-[#5c5e62]" />
                    Loading contacts…
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[0.83rem] text-[#5c5e62]">
                    <Users size={24} className="mx-auto mb-2 text-[#8c8f94]" />
                    No contacts found. Import a CSV to get started.
                  </td>
                </tr>
              ) : contacts.map((c) => {
                const dim = c.status === "unsubscribed";
                const checked = selected.includes(c.id);
                return (
                  <tr
                    key={c.id}
                    className={[
                      "group transition-colors",
                      checked ? "bg-orange-50/60" : dim ? "opacity-50" : "hover:bg-[#f5f5f5]/60",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(c.id)}
                        aria-label={`Select ${c.email}`}
                        className="h-3.5 w-3.5 cursor-pointer accent-[#f4511e]"
                      />
                    </td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#171a20]">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") || <span className="text-[#8c8f94]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#171a20]">{c.email}</td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">{c.company ?? "—"}</td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">{c.country ?? "—"}</td>
                    {/* Chips, not the single primary string — a contact can be
                        in several markets and the row is where they're managed. */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {contactMarkets(c).length === 0 ? (
                          <span className="text-[0.83rem] text-[#8c8f94]">—</span>
                        ) : contactMarkets(c).map((m) => (
                          <span
                            key={m}
                            className="group/chip inline-flex items-center rounded-full bg-[#f0f2f5] py-0.5 pl-2 pr-0.5 text-[0.72rem] font-semibold capitalize text-[#5c5e62]"
                          >
                            {m}
                            <button
                              type="button"
                              onClick={() => requestChipRemove(c, m)}
                              title={`Remove from ${m}`}
                              className="ml-0.5 rounded-full p-0.5 text-[#8c8f94] transition hover:bg-red-100 hover:text-red-600"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => requestChipAdd(c)}
                          title="Add to another market"
                          className="invisible rounded-full p-1 text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20] group-hover:visible"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[0.83rem] text-[#5c5e62]">{c.source ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setOpRequest({
                          op: "move-market",
                          title: "Move to market",
                          description:
                            `${c.email} is in ${contactMarkets(c).map(marketLabel).join(", ") || "no market"}. ` +
                            `Moving replaces that with the market you choose — use the chip "+" to add one alongside instead.`,
                          selector: { contact_ids: [c.id] },
                          excludeMarkets: contactMarkets(c),
                        })}
                        title="Move to market…"
                        className="invisible mr-1 rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20] group-hover:visible"
                      >
                        <ArrowRightLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalContact(c)}
                        title="Edit contact"
                        className="invisible mr-1 rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20] group-hover:visible"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        title="Remove contact"
                        className="invisible rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-red-50 hover:text-red-600 group-hover:visible disabled:opacity-60"
                      >
                        {deletingId === c.id
                          ? <RefreshCw size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-3">
            <span className="text-[0.78rem] text-[#5c5e62]">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <div className="flex items-center gap-1">
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

      {showAddModal && (
        <ContactModal
          markets={markets}
          onClose={() => setShowAddModal(false)}
          onSaved={refreshAll}
        />
      )}
      {modalContact && (
        <ContactModal
          contact={modalContact}
          markets={markets}
          onClose={() => setModalContact(null)}
          onSaved={refreshAll}
        />
      )}
      {opRequest && (
        <MarketOpModal
          request={opRequest}
          markets={markets}
          onClose={() => setOpRequest(null)}
          onApplied={refreshAll}
        />
      )}
    </div>
  );
}
