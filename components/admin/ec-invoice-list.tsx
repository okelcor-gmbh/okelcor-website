"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Download,
  FileCode2, Loader2, Paperclip, Plus, Trash2, X,
} from "lucide-react";
import type { EcInvoiceGroup, EcInvoiceLine, EcInvoiceMeta, EcInvoicePeriodState } from "@/lib/admin-api";
import { formatMoney } from "@/lib/currency";
import { canDo } from "@/lib/admin-permissions";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";

/**
 * EC Invoice List — the Zusammenfassende Meldung portal, from finance's
 * mockup. Per reporting period: customer groups (country × customer VAT ID ×
 * transaction type), each expandable into the itemized invoices behind its
 * aggregate — with the invoice PDF and delivery proof attached, an assignee
 * chasing what is missing, the CSV audit file, and the § 18a ELSTER payload.
 *
 * Everything wraps rather than truncates — the walkthrough rule: no detail
 * may hide behind a horizontal scrollbar.
 */

const INPUT =
  "h-8 w-full rounded-lg border border-black/[0.10] bg-white px-2 text-[0.78rem] text-[#171a20] placeholder:text-[#8c8f94] focus:border-[#E85C1A] focus:outline-none disabled:bg-[#f8f9fa] disabled:text-[#8c8f94]";
const LABEL = "mb-1 block text-[0.68rem] font-bold uppercase tracking-wider text-[#8c8f94]";
const TH = "px-3 py-2 text-left text-[0.68rem] font-bold uppercase tracking-wider text-[#5c5e62]";

const PERIOD_BADGE: Record<string, string> = {
  draft:     "bg-amber-100 text-amber-800",
  ready:     "bg-cyan-100 text-cyan-800",
  submitted: "bg-emerald-100 text-emerald-800",
};

const STATUS_SELECT: Record<string, string> = {
  complete:    "bg-emerald-50 text-emerald-800 border-emerald-200",
  pending_doc: "bg-orange-50 text-orange-800 border-orange-200",
  review:      "bg-amber-50 text-amber-800 border-amber-200",
};

function periodLabel(key: string): string {
  const quarter = key.match(/^(\d{4})-Q([1-4])$/);
  if (quarter) return `Q${quarter[2]} ${quarter[1]}`;
  const month = key.match(/^(\d{4})-(\d{2})$/);
  if (month) {
    const name = new Date(Number(month[1]), Number(month[2]) - 1, 1)
      .toLocaleString("en-GB", { month: "long" });
    return `${name} ${month[1]}`;
  }
  return key;
}

function periodOptions(known: string[]): string[] {
  const year = new Date().getFullYear();
  const out: string[] = [];
  for (const y of [year, year - 1]) {
    for (let q = 1; q <= 4; q++) out.push(`${y}-Q${q}`);
    for (let m = 1; m <= 12; m++) out.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  for (const k of known) if (!out.includes(k)) out.push(k);
  return out;
}

function currentQuarter(): string {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
}

export default function EcInvoiceList({
  initialPeriod, initialLine,
}: {
  initialPeriod: string;
  initialLine: number | null;
}) {
  const { role, permissions } = useAdminPermissions();
  const canManage = canDo(role ?? "", "finance.manage", permissions);
  const canExport = canDo(role ?? "", "orders.export", permissions);

  const [period, setPeriod] = useState(initialPeriod || currentQuarter());
  const [periodState, setPeriodState] = useState<EcInvoicePeriodState | null>(null);
  const [groups, setGroups] = useState<EcInvoiceGroup[]>([]);
  const [meta, setMeta] = useState<EcInvoiceMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const deepLinkDone = useRef(false);

  const [vatDraft, setVatDraft] = useState("");
  const [savingVat, setSavingVat] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingLineFor, setAddingLineFor] = useState<number | null>(null);
  const [xmlOpen, setXmlOpen] = useState(false);
  const [xmlText, setXmlText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ec-invoices?period=${encodeURIComponent(period)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.meta?.ec_invoices_available === false) {
        setUnavailable(json.message ?? json.error ?? "The EC Invoice List isn't available on this server yet.");
        setGroups([]);
      } else {
        setUnavailable(null);
        setPeriodState(json.data?.period ?? null);
        setGroups(Array.isArray(json.data?.groups) ? json.data.groups : []);
        setMeta(json.meta ?? null);
        setVatDraft(json.meta?.company_vat_id ?? "");

        // ?line= — a My Work "Open" or a notification lands on the exact
        // invoice line: expand its group and highlight the row. Once.
        if (!deepLinkDone.current && initialLine != null) {
          deepLinkDone.current = true;
          const owner = (json.data?.groups ?? []).find((g: EcInvoiceGroup) =>
            g.lines.some((l) => l.id === initialLine));
          if (owner) {
            setExpanded((prev) => new Set(prev).add(owner.id));
            setHighlightLine(initialLine);
          } else {
            setNotice("That invoice line is not in this period any more — it may have been moved or deleted.");
          }
        }
      }
    } catch {
      setUnavailable("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [period, initialLine]);

  useEffect(() => { void load(); }, [load]);

  // The period is shareable state — keep it in the URL without a navigation.
  const changePeriod = (next: string) => {
    setPeriod(next);
    setExpanded(new Set());
    const url = new URL(window.location.href);
    url.searchParams.set("period", next);
    url.searchParams.delete("line");
    window.history.replaceState(null, "", url.toString());
  };

  async function saveVat() {
    setSavingVat(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ec-invoices/company-vat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vat_id: vatDraft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.message ?? "Could not save the VAT ID."); return; }
      setNotice("Taxpayer VAT ID saved.");
    } finally {
      setSavingVat(false);
    }
  }

  async function setFilingStatus(status: string) {
    setError(null);
    const res = await fetch(`/api/admin/ec-invoices/periods/${encodeURIComponent(period)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.message ?? "Could not update the filing status."); return; }
    setPeriodState((prev) => ({ ...(prev ?? { period, status }), ...json.data }));
  }

  async function patchLine(line: EcInvoiceLine, patch: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/admin/ec-invoices/lines/${line.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.message ?? "Could not update the invoice line."); return; }
    await load();
  }

  async function removeLine(line: EcInvoiceLine) {
    if (!window.confirm(`Remove invoice ${line.invoice_number}?`)) return;
    const res = await fetch(`/api/admin/ec-invoices/lines/${line.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.message ?? "Could not remove the line.");
      return;
    }
    await load();
  }

  async function removeGroup(group: EcInvoiceGroup) {
    if (!window.confirm(`Remove ${group.country_code} ${group.customer_vat_id} and its ${group.lines.length} invoice(s)?`)) return;
    const res = await fetch(`/api/admin/ec-invoices/groups/${group.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.message ?? "Could not remove the group.");
      return;
    }
    await load();
  }

  async function attachFile(line: EcInvoiceLine, kind: "invoice" | "proof", file: File) {
    setError(null);
    const fd = new FormData();
    fd.append("kind", kind);
    fd.append("file", file);
    const res = await fetch(`/api/admin/ec-invoices/lines/${line.id}/file`, { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setError(json.message ?? "Could not attach that file."); return; }
    await load();
  }

  async function openElster() {
    setError(null);
    try {
      const res = await fetch(`/api/admin/ec-invoices/elster?period=${encodeURIComponent(period)}`);
      const text = await res.text();
      if (!res.ok) {
        try { setError(JSON.parse(text).message ?? "Could not generate the XML."); }
        catch { setError("Could not generate the XML."); }
        return;
      }
      setXmlText(text);
      setXmlOpen(true);
    } catch {
      setError("Could not reach the server.");
    }
  }

  function downloadXml() {
    const blob = new Blob([xmlText], { type: "text/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ZM_ELSTER_${period}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  if (loading && !meta) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-black/[0.06] bg-white p-8 text-[0.83rem] text-[#5c5e62]">
        <Loader2 size={14} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[0.83rem] text-amber-900">
        <p className="font-semibold">Not available on this server yet.</p>
        <p className="mt-0.5">{unavailable}</p>
      </div>
    );
  }

  const filing = periodState?.status ?? "draft";

  return (
    <div className="space-y-4">
      {/* ── Meta strip: VAT, period, filing status, outputs ─────────────── */}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/[0.06] bg-white p-4">
        <div className="min-w-[200px]">
          <label className={LABEL}>Taxpayer VAT ID (USt-IdNr.)</label>
          <div className="flex items-center gap-1.5">
            <input value={vatDraft} onChange={(e) => setVatDraft(e.target.value.toUpperCase())}
              disabled={!canManage} placeholder="DE123456789" className={INPUT} />
            {canManage && vatDraft !== (meta?.company_vat_id ?? "") && (
              <button type="button" onClick={() => void saveVat()} disabled={savingVat}
                className="h-8 shrink-0 rounded-full bg-[#171a20] px-3 text-[0.72rem] font-semibold text-white disabled:opacity-50">
                {savingVat ? "…" : "Save"}
              </button>
            )}
          </div>
        </div>
        <div>
          <label className={LABEL}>Reporting period</label>
          <select value={period} onChange={(e) => changePeriod(e.target.value)} className={`${INPUT} w-auto cursor-pointer pr-7`}>
            {periodOptions(meta?.known_periods ?? []).map((p) => (
              <option key={p} value={p}>
                {periodLabel(p)}{meta?.known_periods?.includes(p) ? " •" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Filing status</label>
          {canManage ? (
            <select value={filing} onChange={(e) => void setFilingStatus(e.target.value)}
              className={`${INPUT} w-auto cursor-pointer pr-7 font-semibold ${PERIOD_BADGE[filing] ?? ""}`}>
              {(meta?.period_statuses ?? ["draft", "ready", "submitted"]).map((s) => (
                <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          ) : (
            <span className={`inline-block rounded-full px-3 py-1.5 text-[0.75rem] font-bold ${PERIOD_BADGE[filing] ?? "bg-gray-100"}`}>
              {filing[0].toUpperCase() + filing.slice(1)}
            </span>
          )}
          {periodState?.submitted_at && (
            <p className="mt-0.5 text-[0.65rem] text-[#8c8f94]">submitted {periodState.submitted_at.slice(0, 10)}</p>
          )}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {canExport && (
            <a href={`/api/admin/ec-invoices/export?period=${encodeURIComponent(period)}`}
              className="flex items-center gap-1.5 rounded-full bg-[#171a20] px-3.5 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-black">
              <Download size={13} /> Export CSV audit file
            </a>
          )}
          <button type="button" onClick={() => void openElster()}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-[0.78rem] font-semibold text-[#171a20] transition hover:bg-[#f0f2f5]">
            <FileCode2 size={13} /> Generate ELSTER XML
          </button>
          {canManage && (
            <button type="button" onClick={() => setAddingGroup(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#E85C1A] px-3.5 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#d44f12]">
              <Plus size={13} /> Add country / customer
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[0.83rem] text-blue-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={13} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
          <span className="flex items-center gap-2"><AlertTriangle size={14} /> {error}</span>
          <button type="button" onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}

      {addingGroup && meta && (
        <GroupForm meta={meta} period={period}
          onCancel={() => setAddingGroup(false)}
          onDone={() => { setAddingGroup(false); void load(); }} />
      )}

      {/* ── The ZM table ────────────────────────────────────────────────── */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center text-[0.83rem] text-[#8c8f94]">
          Nothing in {periodLabel(period)} yet — add a country / customer group to start the list. EU supplies feed the ZM; non-EU exports are tracked right beside them.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/[0.06] bg-[#fafafa]">
                <th className={`${TH} w-8`} />
                <th className={TH}>Country</th>
                <th className={TH}>Customer VAT ID</th>
                <th className={TH}>Transaction type</th>
                <th className={`${TH} text-right`}>Total (€)</th>
                <th className={`${TH} text-right`}>Invoices</th>
                {canManage && <th className={`${TH} w-10`} />}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <GroupRows key={group.id}
                  group={group}
                  meta={meta}
                  open={expanded.has(group.id)}
                  onToggle={() => toggle(group.id)}
                  canManage={canManage}
                  highlightLine={highlightLine}
                  addingLine={addingLineFor === group.id}
                  onAddLine={() => setAddingLineFor(group.id)}
                  onLineFormDone={(message) => {
                    setAddingLineFor(null);
                    if (message) setNotice(message);
                    void load();
                  }}
                  onLineFormCancel={() => setAddingLineFor(null)}
                  onPatchLine={patchLine}
                  onRemoveLine={removeLine}
                  onRemoveGroup={() => void removeGroup(group)}
                  onAttach={attachFile}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ELSTER XML modal ────────────────────────────────────────────── */}
      {xmlOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div role="presentation" className="absolute inset-0 bg-black/50" onClick={() => setXmlOpen(false)} />
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
              <h2 className="text-[0.95rem] font-extrabold text-[#1a1a1a]">
                ELSTER XML payload — {periodLabel(period)}
              </h2>
              <button type="button" onClick={() => setXmlOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5]">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <p className="mb-2 text-[0.75rem] text-[#8c8f94]">
                The § 18a UStG transmission structure: the aggregated figure per customer, whole euros,
                with the Art code from the transaction type. Review it, then download for filing.
                Export groups (non-EU) are <strong>not</strong> in this file — § 18a covers intra-EU
                supplies only; exports stay in the list and the CSV audit export.
              </p>
              <textarea readOnly value={xmlText}
                className="h-72 w-full resize-y rounded-xl border border-black/[0.09] bg-[#f8f9fa] p-3 font-mono text-[0.72rem] text-[#171a20]" />
            </div>
            <div className="flex justify-end gap-2 border-t border-black/[0.06] px-6 py-4">
              <button type="button" onClick={downloadXml}
                className="flex items-center gap-1.5 rounded-full bg-[#E85C1A] px-4 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#d44f12]">
                <Download size={13} /> Download .xml
              </button>
              <button type="button" onClick={() => setXmlOpen(false)}
                className="rounded-full border border-black/10 px-4 py-2 text-[0.78rem] font-semibold text-[#171a20]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── One group: the summary row + the expandable itemization ──────────────────

function GroupRows({
  group, meta, open, onToggle, canManage, highlightLine,
  addingLine, onAddLine, onLineFormDone, onLineFormCancel,
  onPatchLine, onRemoveLine, onRemoveGroup, onAttach,
}: {
  group: EcInvoiceGroup;
  meta: EcInvoiceMeta | null;
  open: boolean;
  onToggle: () => void;
  canManage: boolean;
  highlightLine: number | null;
  addingLine: boolean;
  onAddLine: () => void;
  onLineFormDone: (message: string | null) => void;
  onLineFormCancel: () => void;
  onPatchLine: (line: EcInvoiceLine, patch: Record<string, unknown>) => Promise<void>;
  onRemoveLine: (line: EcInvoiceLine) => Promise<void>;
  onRemoveGroup: () => void;
  onAttach: (line: EcInvoiceLine, kind: "invoice" | "proof", file: File) => Promise<void>;
}) {
  const td = "px-3 py-2.5 text-[0.8rem] text-[#171a20]";

  return (
    <>
      <tr className="cursor-pointer border-b border-black/[0.04] font-semibold transition hover:bg-[#eef4fc]" onClick={onToggle}>
        <td className={`${td} text-[#8c8f94]`}>{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
        <td className={td}>
          <strong>{group.country_code}</strong>
          {group.is_export && (
            <span title="Third-country export — audited here, excluded from the ELSTER XML (§ 18a is intra-EU only)"
              className="ml-1.5 whitespace-nowrap rounded-full bg-sky-100 px-2 py-0.5 text-[0.62rem] font-bold uppercase text-sky-700">
              Export
            </span>
          )}
        </td>
        <td className={`${td} whitespace-normal break-words`}>{group.customer_vat_id}</td>
        <td className={`${td} whitespace-normal break-words font-normal text-[#5c5e62]`}>{group.type_label}</td>
        <td className={`${td} text-right tabular-nums`}>{formatMoney(group.total, "EUR")}</td>
        <td className={`${td} text-right text-[0.72rem] font-normal text-[#8c8f94]`}>{group.lines.length}</td>
        {canManage && (
          <td className={td}>
            <button type="button" onClick={(e) => { e.stopPropagation(); onRemoveGroup(); }}
              className="text-[#8c8f94] transition hover:text-red-600" aria-label="Remove group">
              <Trash2 size={13} />
            </button>
          </td>
        )}
      </tr>

      {open && (
        <tr className="border-b border-black/[0.04] bg-[#f8f9fa]">
          <td colSpan={canManage ? 7 : 6} className="px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[0.75rem] font-bold text-[#5c5e62]">Itemized invoices &amp; audit attachments</span>
              {canManage && !addingLine && (
                <button type="button" onClick={onAddLine}
                  className="flex items-center gap-1 rounded-full bg-[#E85C1A] px-3 py-1 text-[0.72rem] font-semibold text-white transition hover:bg-[#d44f12]">
                  <Plus size={11} /> Add invoice line
                </button>
              )}
            </div>

            {addingLine && meta && (
              <LineForm groupId={group.id} meta={meta} onCancel={onLineFormCancel} onDone={onLineFormDone} />
            )}

            {group.lines.length === 0 ? (
              !addingLine && <p className="py-2 text-[0.78rem] italic text-[#9ca3af]">No invoices in this group yet.</p>
            ) : (
              <table className="w-full rounded-xl bg-white">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    <th className={TH}>Invoice #</th>
                    <th className={TH}>Date</th>
                    <th className={`${TH} text-right`}>Amount (€)</th>
                    <th className={TH}>Assigned person</th>
                    <th className={TH}>Task status</th>
                    <th className={TH}>Invoice PDF</th>
                    <th className={TH}>Delivery proof</th>
                    {canManage && <th className={`${TH} w-8`} />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {group.lines.map((line) => (
                    <LineRow key={line.id}
                      line={line} meta={meta} canManage={canManage}
                      highlighted={line.id === highlightLine}
                      onPatch={onPatchLine} onRemove={onRemoveLine} onAttach={onAttach} />
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function LineRow({
  line, meta, canManage, highlighted, onPatch, onRemove, onAttach,
}: {
  line: EcInvoiceLine;
  meta: EcInvoiceMeta | null;
  canManage: boolean;
  highlighted: boolean;
  onPatch: (line: EcInvoiceLine, patch: Record<string, unknown>) => Promise<void>;
  onRemove: (line: EcInvoiceLine) => Promise<void>;
  onAttach: (line: EcInvoiceLine, kind: "invoice" | "proof", file: File) => Promise<void>;
}) {
  const td = "px-3 py-2 text-[0.78rem] text-[#171a20] align-middle";

  const fileCell = (kind: "invoice" | "proof") => {
    const has  = kind === "invoice" ? line.has_invoice_file : line.has_proof_file;
    const name = kind === "invoice" ? line.invoice_file_name : line.proof_file_name;

    if (has) {
      return (
        <a href={`/api/admin/ec-invoices/lines/${line.id}/download?kind=${kind}`}
          className="inline-flex items-center gap-1 whitespace-normal break-all text-[0.72rem] font-semibold text-[#0056b3] underline-offset-2 hover:underline">
          <Download size={11} className="shrink-0" /> {name ?? (kind === "invoice" ? "Invoice" : "Proof")}
        </a>
      );
    }

    if (!canManage) return <span className="text-[0.72rem] text-[#8c8f94]">missing</span>;

    return (
      <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-dashed border-[#E85C1A]/60 bg-[#fff7f2] px-2 py-1 text-[0.68rem] font-semibold text-[#E85C1A]">
        <Paperclip size={10} /> Attach
        <input type="file" accept={kind === "invoice" ? ".pdf,.jpg,.jpeg,.png" : ".pdf,.png,.jpg,.jpeg"} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void onAttach(line, kind, f); e.target.value = ""; }} />
      </label>
    );
  };

  return (
    <tr
      ref={highlighted ? (el) => el?.scrollIntoView({ block: "center" }) : undefined}
      className={highlighted ? "bg-amber-50 ring-2 ring-inset ring-amber-300" : undefined}
    >
      <td className={td}>
        {canManage ? (
          <input defaultValue={line.invoice_number} className={INPUT}
            onBlur={(e) => e.target.value !== line.invoice_number && e.target.value.trim() !== ""
              && void onPatch(line, { invoice_number: e.target.value.trim() })} />
        ) : (
          <span className="font-semibold">{line.invoice_number}</span>
        )}
      </td>
      <td className={td}>
        {canManage ? (
          <input type="date" defaultValue={line.invoice_date ?? ""} className={INPUT}
            onBlur={(e) => (e.target.value || null) !== (line.invoice_date ?? null)
              && void onPatch(line, { invoice_date: e.target.value || null })} />
        ) : (
          <span className="whitespace-nowrap">{line.invoice_date ?? "—"}</span>
        )}
      </td>
      <td className={`${td} text-right tabular-nums`}>
        {canManage ? (
          <input type="number" step="0.01" min="0" defaultValue={line.amount} className={`${INPUT} text-right`}
            onBlur={(e) => Number(e.target.value) !== line.amount
              && void onPatch(line, { amount: Number(e.target.value) || 0 })} />
        ) : (
          formatMoney(line.amount, "EUR")
        )}
      </td>
      <td className={td}>
        {canManage ? (
          <select value={line.assigned_admin_id ?? ""} className={`${INPUT} cursor-pointer`}
            onChange={(e) => void onPatch(line, { assigned_admin_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">— unassigned —</option>
            {(meta?.staff ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        ) : (
          <span className="whitespace-normal break-words">{line.person ?? "—"}</span>
        )}
      </td>
      <td className={td}>
        <select value={line.task_status} disabled={!canManage}
          onChange={(e) => void onPatch(line, { task_status: e.target.value })}
          className={`h-8 w-full cursor-pointer rounded-lg border px-1.5 text-[0.72rem] font-bold ${STATUS_SELECT[line.task_status] ?? "border-black/[0.10] bg-white"}`}>
          {(meta?.statuses ?? []).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </td>
      <td className={td}>{fileCell("invoice")}</td>
      <td className={td}>{fileCell("proof")}</td>
      {canManage && (
        <td className={`${td} text-right`}>
          <button type="button" onClick={() => void onRemove(line)}
            className="text-[#8c8f94] transition hover:text-red-600" aria-label="Remove line">
            <Trash2 size={12} />
          </button>
        </td>
      )}
    </tr>
  );
}

// ── Forms ─────────────────────────────────────────────────────────────────────

function GroupForm({
  meta, period, onCancel, onDone,
}: {
  meta: EcInvoiceMeta;
  period: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [country, setCountry] = useState("AT");
  const [vatId, setVatId] = useState("");
  const [type, setType] = useState(meta.types[0]?.key ?? "goods");
  const isExport = type === "export";
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/admin/ec-invoices/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, country_code: country, customer_vat_id: vatId, transaction_type: type }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(json.message ?? "Could not add the group."); return; }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-black/[0.06] bg-white p-4">
      <p className="text-[0.72rem] font-bold uppercase tracking-wider text-[#5c5e62]">
        New country transaction group — {periodLabel(period)}
      </p>
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] text-red-700">{formError}</p>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <label className={LABEL}>Transaction type</label>
          <select value={type}
            onChange={(e) => {
              const next = e.target.value;
              setType(next);
              // The two vocabularies do not overlap: an EU state under
              // Export (or a third country under an intra-EU type) is a 422
              // server-side, so the control changes shape with the type.
              setCountry(next === "export" ? "" : meta.countries[0] ?? "AT");
            }}
            className={`${INPUT} cursor-pointer`}>
            {meta.types.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>{isExport ? "Destination country (non-EU, 2 letters)" : "EU member state"}</label>
          {isExport ? (
            <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())}
              placeholder="e.g. US, GH, GB, AE" maxLength={2} required className={`${INPUT} uppercase`} />
          ) : (
            <select value={country}
              onChange={(e) => {
                // Finance's ask: Exports reachable straight from this list,
                // without knowing to change the transaction type first.
                // Picking it flips the type, which reshapes this control
                // into the free-text non-EU destination field.
                if (e.target.value === "__export__") {
                  setType("export");
                  setCountry("");
                } else {
                  setCountry(e.target.value);
                }
              }}
              className={`${INPUT} cursor-pointer`}>
              {meta.countries.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__export__">Exports (non-EU country)</option>
            </select>
          )}
        </div>
        <div>
          <label className={LABEL}>{isExport ? "Customer / tax reference" : "Customer VAT ID (USt-IdNr.)"}</label>
          <input value={vatId} onChange={(e) => setVatId(e.target.value.toUpperCase())}
            placeholder={isExport ? "e.g. MLK-TIRES-LLC" : "e.g. ESB12345678"} required className={INPUT} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-[#E85C1A] px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#d44f12] disabled:opacity-50">
          {busy && <Loader2 size={12} className="animate-spin" />} Add group
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full border border-black/10 px-4 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62]">
          Cancel
        </button>
      </div>
    </form>
  );
}

function LineForm({
  groupId, meta, onCancel, onDone,
}: {
  groupId: number;
  meta: EcInvoiceMeta;
  onCancel: () => void;
  onDone: (message: string | null) => void;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [assignee, setAssignee] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("invoice_number", invoiceNumber);
      if (date) fd.append("invoice_date", date);
      fd.append("amount", amount);
      if (assignee) fd.append("assigned_admin_id", assignee);
      if (invoiceFile) fd.append("invoice_file", invoiceFile);
      if (proofFile) fd.append("proof_file", proofFile);
      const res = await fetch(`/api/admin/ec-invoices/groups/${groupId}/lines`, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(json.message ?? "Could not add the invoice line."); return; }
      // A 201 that still carries a warning means the line saved and a file
      // did not — not a plain success, so not shown as one.
      onDone(json.message && !String(json.message).endsWith("added.") ? String(json.message) : null);
    } finally {
      setBusy(false);
    }
  }

  const fileInput = "text-[0.72rem] file:mr-2 file:rounded-full file:border-0 file:bg-[#171a20] file:px-2.5 file:py-1 file:text-[0.68rem] file:font-semibold file:text-white";

  return (
    <form onSubmit={submit} className="mb-3 space-y-3 rounded-xl border border-black/[0.06] bg-white p-3">
      {formError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] text-red-700">{formError}</p>
      )}
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <div>
          <label className={LABEL}>Invoice #</label>
          <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required maxLength={50} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Amount (€)</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Assign to (notifies them)</label>
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={`${INPUT} cursor-pointer`}>
            <option value="">— nobody —</option>
            {meta.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Invoice PDF</label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" className={fileInput}
            onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Delivery proof</label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" className={fileInput}
            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy}
          className="flex items-center gap-1.5 rounded-full bg-[#E85C1A] px-4 py-1.5 text-[0.78rem] font-semibold text-white transition hover:bg-[#d44f12] disabled:opacity-50">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Save invoice line
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-full border border-black/10 px-4 py-1.5 text-[0.78rem] font-semibold text-[#5c5e62]">
          Cancel
        </button>
      </div>
    </form>
  );
}
