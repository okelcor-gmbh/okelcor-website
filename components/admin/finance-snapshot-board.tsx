"use client";

/**
 * The finance snapshot board — the panel version of finance's D13.html.
 *
 * Same two halves he designed: the six-category pipeline grouped per staff
 * member (click a person to drill into their records), and the "Finance
 * Liquidity Working" table whose derived rows (cash position, liquidity
 * injection request, forecasted cash position) are computed here, never
 * stored. Data lives in the API now, shared across everyone with finance
 * access, instead of one browser's localStorage.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertCircle, Download, FileUp, LineChart, Loader2, Pencil, Plus, Printer,
  RefreshCw, Trash2, Upload, X,
} from "lucide-react";
import {
  getSnapshot, createItem, updateItem, deleteItem, bulkAddItems,
  createLiquidityEntry, updateLiquidityEntry, deleteLiquidityEntry, restoreBackup,
  type SnapshotItem, type LiquidityEntry, type LiquidityInput, type SnapshotMeta, type ItemInput,
} from "@/app/admin/finance-snapshot/actions";

// ── Formatting ────────────────────────────────────────────────────────────────

function fmt(num: number): string {
  if (!num || isNaN(num)) return "—";
  const s = Math.abs(num).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `- ${s}` : s;
}

// ── ISO week helpers — the grid's columns are ISO weeks ('2026-W35') ─────────

function isoWeekMonday(year: number, week: number): Date {
  // ISO: week 1 is the week containing 4 January.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);
  return monday;
}

/** '2026-W35' → '24 Aug – 30 Aug', the file's column subtitle. */
function isoWeekRange(weekKey: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!m) return "";
  const start = isoWeekMonday(+m[1], +m[2]);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const f = (d: Date) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
  return `${f(start)} – ${f(end)}`;
}

function currentIsoWeekKey(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day); // the Thursday decides the ISO year
  const year = d.getUTCFullYear();
  const week = Math.ceil(((+d - +new Date(Date.UTC(year, 0, 1))) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function nextWeekKey(key: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!m) return key;
  let y = +m[1], w = +m[2] + 1;
  const jan1 = new Date(Date.UTC(y, 0, 1)).getUTCDay();
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  if (w > (jan1 === 4 || (leap && jan1 === 3) ? 53 : 52)) { y += 1; w = 1; }
  return `${y}-W${String(w).padStart(2, "0")}`;
}

const inputCls =
  "h-9 w-full rounded-xl border border-black/[0.09] bg-white px-3 text-[0.83rem] text-[#1a1a1a] outline-none placeholder:text-[#aaa] transition focus:border-[#f4511e] focus:ring-2 focus:ring-[#f4511e]/10";

const STATUS_COLORS: Record<string, string> = {
  Pending:        "bg-amber-100 text-amber-700",
  Sent:           "bg-blue-100 text-blue-700",
  "In Progress":  "bg-cyan-100 text-cyan-700",
  "Under Review": "bg-violet-100 text-violet-700",
  Approved:       "bg-emerald-100 text-emerald-700",
  Completed:      "bg-emerald-100 text-emerald-800",
  Cancelled:      "bg-gray-100 text-gray-500",
};

// ── CSV parsing (same tolerant header matching as the original board) ─────────

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { out.push(cur.trim().replace(/^"|"$/g, "")); cur = ""; }
    else cur += ch;
  }
  out.push(cur.trim().replace(/^"|"$/g, ""));
  return out;
}

function parseCSV(text: string, categories: string[]): ItemInput[] {
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const idx = (...needles: string[]) => headers.findIndex((h) => needles.some((n) => h.includes(n)));

  const catIdx = idx("category"), personIdx = idx("person", "staff", "owner"), refIdx = idx("ref");
  const dateIdx = idx("date"), clientIdx = idx("client", "customer", "address");
  const statusIdx = idx("status"), commentIdx = idx("comment", "notes", "remark");
  const amountIdx = idx("amount", "total", "price");

  const items: ItemInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length === 0) continue;
    const rawCat = catIdx !== -1 ? row[catIdx] : "";
    const category = categories.find((c) => c.toLowerCase() === rawCat.toLowerCase()) ?? categories[0];
    const amount = amountIdx !== -1 ? parseFloat(row[amountIdx].replace(/[^0-9.-]+/g, "")) : 0;
    items.push({
      category,
      person:  (personIdx !== -1 && row[personIdx]) || "Unassigned",
      ref:     (refIdx !== -1 && row[refIdx]) || `REF-${i}`,
      date:    (dateIdx !== -1 && row[dateIdx]) || null,
      client:  (clientIdx !== -1 && row[clientIdx]) || null,
      status:  (statusIdx !== -1 && row[statusIdx]) || "Pending",
      comment: (commentIdx !== -1 && row[commentIdx]) || null,
      amount:  isNaN(amount) ? 0 : amount,
    });
  }
  return items;
}

// ── Component ─────────────────────────────────────────────────────────────────

type ItemModalState = { mode: "create" | "edit"; item?: SnapshotItem; presetCategory?: string; presetPerson?: string } | null;
type DrillState = { category: string; person: string } | null;
type LiqModalState = { line: string; label: string; week: string } | null;

export default function FinanceSnapshotBoard() {
  const [items, setItems]         = useState<SnapshotItem[]>([]);
  const [liquidity, setLiquidity] = useState<LiquidityEntry[]>([]);
  const [meta, setMeta]           = useState<SnapshotMeta | null>(null);
  const [loading, setLoading]     = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [notice, setNotice]       = useState<string | null>(null);
  const [, startTransition]       = useTransition();

  const [drill, setDrill]           = useState<DrillState>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const deepLinkDone = useRef(false);
  const [itemModal, setItemModal]   = useState<ItemModalState>(null);
  const [liqModal, setLiqModal]     = useState<LiqModalState>(null);
  const [saving, setSaving]         = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef  = useRef<HTMLInputElement>(null);

  // Form state for the item modal
  const [fCategory, setFCategory] = useState("");
  const [fPerson, setFPerson]     = useState("");
  const [fAssignee, setFAssignee] = useState<string>("");   // admin user id as string, "" = untagged
  const [fRef, setFRef]           = useState("");
  const [fDate, setFDate]         = useState("");
  const [fClient, setFClient]     = useState("");
  const [fStatus, setFStatus]     = useState("Pending");
  const [fComment, setFComment]   = useState("");
  const [fAmount, setFAmount]     = useState("");

  // Form state for adding a liquidity line
  const [lSupplier, setLSupplier] = useState("");
  const [lDesc, setLDesc] = useState("");
  const [lAmount, setLAmount] = useState("");
  const [lCurrency, setLCurrency] = useState("EUR");
  const [lComment, setLComment] = useState("");
  // Weeks added by hand before any entry exists in them, so a fresh column
  // can be started from the grid.
  const [extraWeeks, setExtraWeeks] = useState<string[]>([]);

  const load = useCallback(() => {
    startTransition(async () => {
      const res = await getSnapshot();
      if (res.error || !res.data) { setPageError(res.error ?? "Failed to load."); setLoading(false); return; }
      setItems(res.data.items);
      setLiquidity(res.data.liquidity);
      setMeta(res.data.meta);
      setPageError(null);
      setLoading(false);

      // ?item=<id> — a My Work "Open" or a notification lands on the exact
      // record, not the whole page: open its person's drill-down and
      // highlight the row. Once, on the first successful load.
      if (!deepLinkDone.current) {
        deepLinkDone.current = true;
        const raw = new URLSearchParams(window.location.search).get("item");
        const id = raw ? Number(raw) : NaN;
        if (Number.isFinite(id)) {
          const target = res.data.items.find((i) => i.id === id);
          if (target) {
            setHighlightId(id);
            setDrill({ category: target.category, person: target.person });
          } else {
            setNotice("That task is no longer on the board — it may have been deleted.");
          }
        }
      }
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Derived: the weekly grid, finance's "Liquidity File" summary ──────────
  //
  // Columns are the ISO weeks that hold entries (plus any started by hand);
  // rows are the served line list. The computed rows follow the file's own
  // formulas: Cash Position = Bank Balance + every expense line, and
  // Forecasted Cash Position = Cash Position + Revenue Payment. Which lines
  // count as expenses is SERVED (meta.liquidity_expense_lines), so the
  // arithmetic here cannot drift from the API's row list.

  const liq = useMemo(() => {
    const lines = meta?.liquidity_lines ?? [];
    const expense = new Set(meta?.liquidity_expense_lines ?? []);
    const weekly = liquidity.filter((e) => e.week_key);

    const weeks = [...new Set([...weekly.map((e) => e.week_key as string), ...extraWeeks])].sort();
    if (weeks.length === 0) weeks.push(currentIsoWeekKey());

    const cell = (line: string, week: string) =>
      weekly.filter((e) => e.line === line && e.week_key === week).reduce((sum, e) => sum + e.amount, 0);

    const rows = lines.map((l) => {
      const values = weeks.map((w) => cell(l.key, w));
      return { key: l.key, label: l.label, values, total: values.reduce((sum, v) => sum + v, 0) };
    });
    const rowFor = (key: string) => rows.find((r) => r.key === key);

    const cashValues = weeks.map((_, i) =>
      (rowFor("bank_balance")?.values[i] ?? 0)
      + rows.filter((r) => expense.has(r.key)).reduce((sum, r) => sum + r.values[i], 0));
    const forecastValues = cashValues.map((v, i) => v + (rowFor("revenue_payment")?.values[i] ?? 0));
    const total = (arr: number[]) => arr.reduce((sum, v) => sum + v, 0);

    // Weeks before the SERVER'S current week are closed — the API refuses
    // writes landing in them, so the grid must say so rather than offer
    // controls that 422. Server clock, not the browser's: the refusal and
    // the label have to agree.
    const currentWeek = meta?.current_week ?? currentIsoWeekKey();
    const isClosed = (w: string) => w < currentWeek;

    // Where a record can be MOVED to: every open week on the grid, plus the
    // next few beyond it, so rolling forward never requires creating the
    // destination column first.
    let horizon = weeks[weeks.length - 1] >= currentWeek ? weeks[weeks.length - 1] : currentWeek;
    const openWeeks = weeks.filter((w) => !isClosed(w));
    if (!openWeeks.includes(currentWeek)) openWeeks.unshift(currentWeek);
    for (let i = 0; i < 4; i++) {
      horizon = nextWeekKey(horizon);
      if (!openWeeks.includes(horizon)) openWeeks.push(horizon);
    }
    openWeeks.sort();

    return {
      weeks,
      currentWeek,
      isClosed,
      openWeeks,
      bankRow:     rowFor("bank_balance"),
      expenseRows: rows.filter((r) => expense.has(r.key)),
      revenueRow:  rowFor("revenue_payment"),
      cash:     { values: cashValues, total: total(cashValues) },
      forecast: { values: forecastValues, total: total(forecastValues) },
      // Rows from the retired month-bucket format — counted so their
      // absence from the grid is explained rather than silent.
      legacyCount: liquidity.filter((e) => !e.week_key).length,
    };
  }, [liquidity, meta, extraWeeks]);

  // ── Item modal helpers ─────────────────────────────────────────────────────

  const openCreateItem = (presetCategory?: string, presetPerson?: string) => {
    setFCategory(presetCategory ?? meta?.categories[0] ?? "");
    setFPerson(presetPerson ?? "");
    setFAssignee("");
    setFRef(""); setFDate(new Date().toISOString().split("T")[0]);
    setFClient(""); setFStatus("Pending"); setFComment(""); setFAmount("");
    setModalError(null);
    setItemModal({ mode: "create", presetCategory, presetPerson });
  };

  const openEditItem = (item: SnapshotItem) => {
    setFCategory(item.category); setFPerson(item.person); setFRef(item.ref);
    setFAssignee(item.assigned_admin_id ? String(item.assigned_admin_id) : "");
    setFDate(item.date ?? ""); setFClient(item.client ?? "");
    setFStatus(item.status); setFComment(item.comment ?? "");
    setFAmount(String(item.amount));
    setModalError(null);
    setItemModal({ mode: "edit", item });
  };

  // Picking a staff member fills the display name too (still editable) — the
  // tag is what notifies them and routes the record to their My Work queue.
  const pickAssignee = (value: string) => {
    setFAssignee(value);
    if (value) {
      const staff = meta?.staff.find((s) => String(s.id) === value);
      if (staff) setFPerson(staff.name);
    }
  };

  const submitItem = (e: React.FormEvent) => {
    e.preventDefault();
    const input: ItemInput = {
      category: fCategory, person: fPerson.trim(), ref: fRef.trim(),
      assigned_admin_id: fAssignee ? Number(fAssignee) : null,
      date: fDate || null, client: fClient.trim() || null,
      status: fStatus, comment: fComment.trim() || null,
      amount: parseFloat(fAmount) || 0,
    };
    setSaving(true);
    setModalError(null);
    startTransition(async () => {
      const res = itemModal?.mode === "edit" && itemModal.item
        ? await updateItem(itemModal.item.id, input)
        : await createItem(input);
      setSaving(false);
      if (res.error || !res.item) { setModalError(res.error ?? "Save failed."); return; }
      const saved = res.item;
      setItems((prev) => {
        const exists = prev.some((i) => i.id === saved.id);
        return exists ? prev.map((i) => (i.id === saved.id ? saved : i)) : [...prev, saved];
      });
      setItemModal(null);
    });
  };

  const removeItem = (id: number) => {
    if (!window.confirm("Delete this record?")) return;
    startTransition(async () => {
      const res = await deleteItem(id);
      if (res.error) { setNotice(res.error); return; }
      setItems((prev) => prev.filter((i) => i.id !== id));
    });
  };

  // ── Liquidity modal helpers ────────────────────────────────────────────────

  const liqModalEntries = liqModal
    ? liquidity.filter((e) => e.line === liqModal.line && e.week_key === liqModal.week)
    : [];

  const submitLiquidityLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liqModal) return;
    const input: LiquidityInput = {
      line: liqModal.line, week_key: liqModal.week,
      supplier: lSupplier.trim() || null,
      description: lDesc.trim() || null,
      amount: parseFloat(lAmount) || 0,
      currency: (lCurrency.trim() || "EUR").toUpperCase(),
      comment: lComment.trim() || null,
    };
    setSaving(true);
    startTransition(async () => {
      const res = await createLiquidityEntry(input);
      setSaving(false);
      if (res.error || !res.entry) { setModalError(res.error ?? "Save failed."); return; }
      setLiquidity((prev) => [...prev, res.entry!]);
      setLSupplier(""); setLDesc(""); setLAmount(""); setLComment("");
    });
  };

  const patchLiquidity = (
    entry: LiquidityEntry,
    field: "supplier" | "description" | "amount" | "currency" | "comment",
    value: string,
  ) => {
    const next: LiquidityInput = {
      line: entry.line, week_key: entry.week_key ?? currentIsoWeekKey(),
      supplier: field === "supplier" ? (value || null) : entry.supplier,
      description: field === "description" ? value : entry.description,
      amount: field === "amount" ? (parseFloat(value) || 0) : entry.amount,
      currency: field === "currency" ? (value.toUpperCase() || "EUR") : entry.currency,
      comment: field === "comment" ? (value || null) : entry.comment,
    };
    startTransition(async () => {
      const res = await updateLiquidityEntry(entry.id, next);
      if (res.error || !res.entry) { setNotice(res.error ?? "Update failed."); return; }
      setLiquidity((prev) => prev.map((x) => (x.id === entry.id ? res.entry! : x)));
    });
  };

  // The move that used to be delete-and-retype: same entry, new week. The
  // modal follows the record so finance sees where it landed.
  const moveLiquidity = (entry: LiquidityEntry, week: string) => {
    if (!week || week === entry.week_key) return;
    const next: LiquidityInput = {
      line: entry.line, week_key: week,
      supplier: entry.supplier, description: entry.description,
      amount: entry.amount, currency: entry.currency, comment: entry.comment,
    };
    startTransition(async () => {
      const res = await updateLiquidityEntry(entry.id, next);
      if (res.error || !res.entry) { setModalError(res.error ?? "Move failed."); return; }
      setLiquidity((prev) => prev.map((x) => (x.id === entry.id ? res.entry! : x)));
      setLiqModal((m) => (m ? { ...m, week } : m));
    });
  };

    const openLiqCell = (line: string, label: string, week: string) => {
    setModalError(null);
    setLSupplier(""); setLDesc(""); setLAmount(""); setLCurrency("EUR"); setLComment("");
    setLiqModal({ line, label, week });
  };

  const removeLiquidity = (id: number) => {
    startTransition(async () => {
      const res = await deleteLiquidityEntry(id);
      if (res.error) { setNotice(res.error); return; }
      setLiquidity((prev) => prev.filter((x) => x.id !== id));
    });
  };

  // ── Backup / restore / CSV ─────────────────────────────────────────────────

  const downloadBackup = () => {
    // Exported in the SAME shape as the original board, so a file from here
    // restores there and vice versa.
    const lines = meta?.liquidity_lines ?? [];
    const liquidityItems = lines.map((l) => ({
      id: l.key, label: l.label,
      openCurrent: liquidity.filter((e) => e.line === l.key && e.period === "open_current")
        .map((e) => ({ id: e.id, desc: e.description, ref: e.reference ?? "", amount: e.amount })),
      nextMonth: liquidity.filter((e) => e.line === l.key && e.period === "next_month")
        .map((e) => ({ id: e.id, desc: e.description, ref: e.reference ?? "", amount: e.amount })),
    }));
    const blob = new Blob(
      // weeklyEntries: the current weekly-grid rows, raw. The D13 restore
      // ignores the key; it is here so a backup taken from the weekly board
      // does not silently drop what the two-period shape cannot express.
      [JSON.stringify({ items, liquidityItems, weeklyEntries: liquidity.filter((e) => e.week_key) }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `financial_snapshot_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!window.confirm("Restoring a backup REPLACES everything currently on the board. Continue?")) return;
    const reader = new FileReader();
    reader.onload = () => {
      let parsed: unknown;
      try { parsed = JSON.parse(String(reader.result)); }
      catch { setNotice("That file is not valid JSON."); return; }
      startTransition(async () => {
        const res = await restoreBackup(parsed);
        if (res.error) { setNotice(res.error); return; }
        setNotice(res.message ?? "Backup restored.");
        load();
      });
    };
    reader.readAsText(file);
  };

  const onCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !meta) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(String(reader.result), meta.categories);
      if (rows.length === 0) { setNotice("No usable rows found in that CSV."); return; }
      startTransition(async () => {
        const res = await bulkAddItems(rows);
        if (res.error) { setNotice(res.error); return; }
        setNotice(res.message ?? `${rows.length} record(s) added from CSV.`);
        load();
      });
    };
    reader.readAsText(file);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#f4511e]" />
      </div>
    );
  }

  if (pageError) {
    // The board is finance-only (Session 103), but people who used it daily
    // before the lockdown still land here — stale tabs, bookmarks, muscle
    // memory. A tagged task is worked from My Work, and a dead end that
    // does not say so reads as "I was tagged but I have no access".
    const restricted = /permission/i.test(pageError);
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <AlertCircle size={32} className="mb-3 text-amber-400" strokeWidth={1.5} />
        <p className="mb-1 text-[1rem] font-bold text-[#1a1a1a]">
          {restricted ? "The finance snapshot is restricted to Finance" : "Finance snapshot unavailable"}
        </p>
        <p className="mb-5 max-w-md text-[0.83rem] text-[#6b7280]">
          {restricted
            ? "Only the finance team and super admins can open the full board. If you were tagged on a task, everything you need — the details, the status, a note back — is in My Work."
            : pageError}
        </p>
        {restricted ? (
          <a href="/admin/my-work"
            className="flex items-center gap-2 rounded-full bg-[#f4511e] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#df4618]">
            Open My Work
          </a>
        ) : (
          <button type="button" onClick={() => { setLoading(true); load(); }}
            className="flex items-center gap-2 rounded-full bg-[#f4511e] px-5 py-2.5 text-[0.85rem] font-semibold text-white transition hover:bg-[#df4618]">
            <RefreshCw size={14} /> Retry
          </button>
        )}
      </div>
    );
  }

  const categories = meta?.categories ?? [];

  return (
    <div className="p-6 lg:p-8 print:p-0">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2.5">
          <LineChart size={18} className="text-[#f4511e]" strokeWidth={2} />
          <div>
            <h1 className="text-[1.15rem] font-extrabold text-[#1a1a1a]">Finance Snapshot</h1>
            <p className="text-[0.8rem] text-[#6b7280]">Pipeline by staff member, and the liquidity working</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-[0.78rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]">
            <Printer size={13} /> Print
          </button>
          {/* Spreadsheet downloads — plain navigations so the browser's own
              download handling applies; the proxy routes forward the API's
              BOM-prefixed CSVs with their filenames. The liquidity file is
              in the import's own column layout, so what finance downloads
              is also what liquidity:import can restore. */}
          <a href="/api/admin/finance-snapshot/export" download
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-[0.78rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]">
            <Download size={13} /> Snapshot CSV
          </a>
          <a href="/api/admin/finance-snapshot/liquidity/export" download
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-[0.78rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]">
            <Download size={13} /> Liquidity CSV
          </a>
          <button type="button" onClick={downloadBackup} className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-[0.78rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]">
            <Download size={13} /> Backup JSON
          </button>
          <button type="button" onClick={() => jsonInputRef.current?.click()} className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-[0.78rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]">
            <Upload size={13} /> Restore JSON
          </button>
          <button type="button" onClick={() => csvInputRef.current?.click()} className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-2 text-[0.78rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]">
            <FileUp size={13} /> Upload CSV
          </button>
          <button type="button" onClick={() => openCreateItem()} className="flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618]">
            <Plus size={13} /> Add Record
          </button>
          <input ref={jsonInputRef} type="file" accept=".json" className="hidden" onChange={onRestoreFile} />
          <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={onCSVFile} />
        </div>
      </div>

      {notice && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[0.83rem] text-blue-800 print:hidden">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={13} /></button>
        </div>
      )}

      {/* ── The six category boxes ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          const total = catItems.reduce((s, i) => s + i.amount, 0);
          const byPerson = new Map<string, { count: number; total: number }>();
          catItems.forEach((i) => {
            const p = i.person.trim();
            const cur = byPerson.get(p) ?? { count: 0, total: 0 };
            byPerson.set(p, { count: cur.count + 1, total: cur.total + i.amount });
          });

          return (
            <div key={cat} className="flex min-h-[220px] flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
              <div className="mb-1 flex items-start justify-between gap-2">
                <span className="rounded-lg bg-[#1a1a1a] px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide text-white">{cat}</span>
                <div className="text-right">
                  <span className="text-[1.3rem] font-extrabold leading-none text-[#1a1a1a]">{fmt(total)}</span>
                  <span className="ml-1.5 text-[0.75rem] font-bold text-[#6b7280]">{catItems.length} items</span>
                </div>
              </div>
              <p className="mb-3 text-[0.75rem] font-semibold text-[#9ca3af]">{byPerson.size} staff handling</p>

              <div className="flex flex-1 flex-col gap-1.5">
                {byPerson.size === 0 && (
                  <p className="py-3 text-[0.78rem] italic text-[#9ca3af]">No active records in this section.</p>
                )}
                {[...byPerson.entries()].map(([person, agg], idx) => (
                  <button
                    key={person}
                    type="button"
                    onClick={() => setDrill({ category: cat, person })}
                    className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#f8f9fa] px-3 py-2 text-left transition hover:bg-[#f0f2f5]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-[0.7rem] font-extrabold text-[#9ca3af]">{idx + 1}.</span>
                      <span>
                        <span className="block text-[0.8rem] font-bold text-[#1a1a1a]">{person}</span>
                        <span className="block text-[0.68rem] font-semibold text-[#9ca3af]">{agg.count} {agg.count === 1 ? "item" : "items"}</span>
                      </span>
                    </span>
                    <span className="text-[0.83rem] font-extrabold text-[#1a1a1a]">{fmt(agg.total)}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => openCreateItem(cat)}
                className="mt-3 self-start text-[0.72rem] font-semibold text-[#f4511e] transition hover:text-[#df4618] print:hidden"
              >
                + Add to {cat.toLowerCase()}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Liquidity working ── */}
      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/[0.06]">
        <div className="bg-[#1a1a1a] px-4 py-3 text-center text-[0.8rem] font-extrabold uppercase tracking-wide text-white">
          Finance Liquidity Working
        </div>
        <div className="overflow-x-auto">
          {/* The Summary grid of finance's Liquidity File: categories down,
              ISO weeks across, a Total column, and the file's two computed
              rows. Cells open the Details behind them. */}
          <table className="w-full min-w-[720px] text-[0.8rem]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-amber-400/90 text-[#1a1a1a]">
                <th className="px-4 py-2 text-left font-extrabold">Item</th>
                {liq.weeks.map((w) => (
                  <th key={w} className={`px-3 py-1.5 text-right font-extrabold ${liq.isClosed(w) ? "opacity-60" : ""}`}>
                    Week {w.slice(6).replace(/^0/, "")}
                    {liq.isClosed(w) && (
                      <span title="This week has ended — its records are read-only; unpaid items can still be moved forward."
                        className="ml-1 rounded-full bg-black/15 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase">Closed</span>
                    )}
                    <span className="block text-[0.62rem] font-semibold opacity-70">{isoWeekRange(w)}</span>
                  </th>
                ))}
                <th className="px-4 py-2 text-right font-extrabold">Total</th>
                <th className="px-2 py-2 text-right print:hidden">
                  <button type="button"
                    title="Start the next week's column"
                    onClick={() => {
                      // Never "start" a closed week: extend from whichever
                      // is later, the last shown column or the current week.
                      const last = liq.weeks[liq.weeks.length - 1];
                      setExtraWeeks((prev) => [...prev, nextWeekKey(last >= liq.currentWeek ? last : liq.currentWeek)]);
                    }}
                    className="rounded-md border border-black/20 px-1.5 py-0.5 text-[0.65rem] font-bold transition hover:bg-black/10">
                    + Week
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {liq.bankRow && (
                <WeekGridRow row={liq.bankRow} positive weeks={liq.weeks}
                  onOpen={(week) => openLiqCell(liq.bankRow!.key, liq.bankRow!.label, week)} />
              )}
              {liq.expenseRows.map((r) => (
                <WeekGridRow key={r.key} row={r} weeks={liq.weeks}
                  onOpen={(week) => openLiqCell(r.key, r.label, week)} />
              ))}

              <tr className="border-t-2 border-black/20 font-bold">
                <td className="px-4 py-2">Cash Position</td>
                {[...liq.cash.values, liq.cash.total].map((v, i) => (
                  <td key={i} className={`px-3 py-2 text-right font-mono ${v >= 0 ? "bg-emerald-100" : "bg-red-200"}`}>{fmt(v)}</td>
                ))}
                <td />
              </tr>
              <tr><td colSpan={liq.weeks.length + 3} className="h-3" /></tr>
              {liq.revenueRow && (
                <WeekGridRow row={liq.revenueRow} positive weeks={liq.weeks}
                  onOpen={(week) => openLiqCell(liq.revenueRow!.key, liq.revenueRow!.label, week)} />
              )}
              <tr className="border-t border-black/10 font-bold">
                <td className="px-4 py-2">Forecasted Cash Position</td>
                {[...liq.forecast.values, liq.forecast.total].map((v, i) => (
                  <td key={i} className={`px-3 py-2 text-right font-mono ${v >= 0 ? "bg-emerald-100" : "bg-red-200"}`}>{fmt(v)}</td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-[0.7rem] text-[#9ca3af] print:hidden">
          Click any amount to view and edit the entries behind it — supplier, week, amount and comment.
          {liq.legacyCount > 0 && (
            <span className="ml-2 font-semibold text-amber-600">
              {liq.legacyCount} entr{liq.legacyCount === 1 ? "y" : "ies"} from the old month-bucket board {liq.legacyCount === 1 ? "is" : "are"} not shown — the weekly file replaces them.
            </span>
          )}
        </p>
      </div>

      {/* ── Drill-down modal: one person in one category ── */}
      {drill && (
        <Modal onClose={() => { setDrill(null); setHighlightId(null); }} title={`${drill.person} — ${drill.category}`} wide>
          {(() => {
            const personItems = items.filter(
              (i) => i.category === drill.category && i.person.trim().toLowerCase() === drill.person.trim().toLowerCase()
            );
            const total = personItems.reduce((s, i) => s + i.amount, 0);
            return (
              <>
                <p className="mb-3 text-[0.8rem] font-semibold text-[#6b7280]">
                  Total: {fmt(total)} ({personItems.length} items)
                </p>
                {/* No min-width and no truncation: long client names and
                    emails wrap onto a second line, so nothing hides behind a
                    horizontal scrollbar. */}
                <div>
                  <table className="w-full text-left text-[0.8rem]">
                    <thead>
                      <tr className="border-b border-black/[0.08] bg-[#f8f9fa] text-[#6b7280]">
                        <th className="px-3 py-2 font-bold">Ref #</th>
                        <th className="px-3 py-2 font-bold">Date</th>
                        <th className="px-3 py-2 font-bold">Client</th>
                        <th className="px-3 py-2 font-bold">Status</th>
                        <th className="px-3 py-2 font-bold">Comment</th>
                        <th className="px-3 py-2 text-right font-bold">Amount</th>
                        <th className="px-3 py-2 text-right font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05]">
                      {personItems.map((item) => (
                        <tr key={item.id}
                          ref={item.id === highlightId ? (el) => el?.scrollIntoView({ block: "center" }) : undefined}
                          className={item.id === highlightId ? "bg-amber-50 ring-2 ring-inset ring-amber-300" : undefined}>
                          <td className="px-3 py-2 font-bold">{item.ref}</td>
                          <td className="whitespace-nowrap px-3 py-2">{item.date ?? "—"}</td>
                          <td className="whitespace-normal break-words px-3 py-2">{item.client ?? "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-600"}`}>{item.status}</span>
                            {item.assigned_admin_id && (
                              <span title={`Tagged: ${item.assignee_name ?? ""} — notified and in their My Work`}
                                className="ml-1 whitespace-nowrap rounded-full bg-indigo-100 px-2 py-0.5 text-[0.65rem] font-bold text-indigo-700">
                                @{item.assignee_name ?? "tagged"}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-normal break-words px-3 py-2 italic text-[#6b7280]">{item.comment ?? "—"}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-bold">{fmt(item.amount)}</td>
                          <td className="px-3 py-2">
                            <span className="flex justify-end gap-1.5">
                              <button type="button" title="Edit" onClick={() => openEditItem(item)}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-black/[0.09] text-[#6b7280] transition hover:border-[#f4511e] hover:text-[#f4511e]">
                                <Pencil size={11} />
                              </button>
                              <button type="button" title="Delete" onClick={() => removeItem(item.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-md border border-black/[0.09] text-[#6b7280] transition hover:border-red-400 hover:text-red-500">
                                <Trash2 size={11} />
                              </button>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={() => openCreateItem(drill.category, drill.person)}
                  className="mt-4 flex items-center gap-1.5 rounded-full bg-[#f4511e] px-4 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618]">
                  <Plus size={13} /> Add for {drill.person}
                </button>
              </>
            );
          })()}
        </Modal>
      )}

      {/* ── Add / edit record modal ── */}
      {itemModal && meta && (
        <Modal onClose={() => setItemModal(null)} title={itemModal.mode === "create" ? "Add New Record" : "Edit Record"}>
          {modalError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
              <AlertCircle size={13} className="shrink-0" /> {modalError}
            </div>
          )}
          <form onSubmit={submitItem} className="space-y-3">
            <Field label="Category">
              <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {meta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tag a staff member (they get notified + it lands in their My Work)">
              <select value={fAssignee} onChange={(e) => pickAssignee(e.target.value)} className={`${inputCls} cursor-pointer`}>
                <option value="">— No tag (name only) —</option>
                {meta.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Person (display name)">
                <input type="text" value={fPerson} onChange={(e) => setFPerson(e.target.value)} placeholder="e.g. Edinah" required className={inputCls} />
              </Field>
              <Field label="Ref #">
                <input type="text" value={fRef} onChange={(e) => setFRef(e.target.value)} placeholder="e.g. AN-1271" required className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date">
                <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Amount">
                <input type="number" step="0.01" value={fAmount} onChange={(e) => setFAmount(e.target.value)} placeholder="0.00" required className={inputCls} />
              </Field>
            </div>
            <Field label="Client name & address">
              <input type="text" value={fClient} onChange={(e) => setFClient(e.target.value)} placeholder="e.g. Hipf Wolfgang, Unterföhring" className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={`${inputCls} cursor-pointer`}>
                {meta.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Status comment / notes">
              <textarea value={fComment} onChange={(e) => setFComment(e.target.value)} rows={2} placeholder="e.g. Edinah to contact client" className={`${inputCls} h-auto py-2`} />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setItemModal(null)} className="h-9 rounded-full border border-black/10 px-4 text-[0.8rem] font-semibold text-[#1a1a1a] transition hover:bg-[#f0f2f5]">Cancel</button>
              <button type="submit" disabled={saving} className="h-9 rounded-full bg-[#f4511e] px-5 text-[0.8rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60">
                {saving ? "Saving…" : itemModal.mode === "create" ? "Save Record" : "Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Liquidity breakdown modal ── */}
      {liqModal && (
        <Modal onClose={() => setLiqModal(null)} title={`${liqModal.label} — Week ${liqModal.week.slice(6).replace(/^0/, "")} (${isoWeekRange(liqModal.week)})${liq.isClosed(liqModal.week) ? " — CLOSED" : ""}`} wide>
          {modalError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.83rem] text-red-700">
              <AlertCircle size={13} className="shrink-0" /> {modalError}
            </div>
          )}
          {liq.isClosed(liqModal.week) && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[0.8rem] text-amber-800">
              This week has ended, so its records are read-only. An unpaid or unfinished item can still be
              <strong> moved to an open week</strong> with the Week selector on its row — that is the one change a closed week allows.
            </div>
          )}
          {/* The Details ledger behind this cell — the file's own columns. */}
          <table className="w-full text-left text-[0.8rem]">
            <thead>
              <tr className="border-b border-black/[0.08] bg-[#f8f9fa] text-[#6b7280]">
                <th className="px-3 py-2 font-bold">Supplier</th>
                <th className="px-3 py-2 font-bold">Description</th>
                <th className="px-3 py-2 text-right font-bold">Amount</th>
                <th className="px-3 py-2 font-bold">CUR</th>
                <th className="px-3 py-2 font-bold">Comment</th>
                <th className="px-3 py-2 font-bold">Week</th>
                <th className="px-3 py-2 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05]">
              {liqModalEntries.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-4 text-center italic text-[#9ca3af]">No entries for this line and week yet. Add one below.</td></tr>
              )}
              {liqModalEntries.map((entry) => {
                const closed = liq.isClosed(liqModal.week);
                const roCls = closed ? `${inputCls} pointer-events-none bg-[#f8f9fa] text-[#6b7280]` : inputCls;
                return (
                <tr key={entry.id}>
                  <td className="px-3 py-1.5">
                    <input type="text" readOnly={closed} defaultValue={entry.supplier ?? ""} onBlur={(e) => !closed && e.target.value !== (entry.supplier ?? "") && patchLiquidity(entry, "supplier", e.target.value)} className={roCls} />
                  </td>
                  <td className="px-3 py-1.5">
                    <input type="text" readOnly={closed} defaultValue={entry.description} onBlur={(e) => !closed && e.target.value !== entry.description && patchLiquidity(entry, "description", e.target.value)} className={roCls} />
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <input type="number" step="0.01" readOnly={closed} defaultValue={entry.amount} onBlur={(e) => !closed && parseFloat(e.target.value) !== entry.amount && patchLiquidity(entry, "amount", e.target.value)} className={`${closed ? roCls : inputCls} w-28 text-right font-bold`} />
                  </td>
                  <td className="px-3 py-1.5">
                    <input type="text" maxLength={3} readOnly={closed} defaultValue={entry.currency} onBlur={(e) => !closed && e.target.value.toUpperCase() !== entry.currency && patchLiquidity(entry, "currency", e.target.value)} className={`${closed ? roCls : inputCls} w-14 uppercase`} />
                  </td>
                  <td className="px-3 py-1.5">
                    <input type="text" readOnly={closed} defaultValue={entry.comment ?? ""} placeholder="e.g. To Pay on 30-Sep-2026" onBlur={(e) => !closed && e.target.value !== (entry.comment ?? "") && patchLiquidity(entry, "comment", e.target.value)} className={roCls} />
                  </td>
                  <td className="px-3 py-1.5">
                    {/* The move that replaces delete-and-retype. Always
                        offered — in a closed week it is the ONLY control, in
                        an open one it saves the round trip. Options are open
                        weeks only; the API refuses anything else anyway. */}
                    <select value={entry.week_key ?? ""} onChange={(e) => moveLiquidity(entry, e.target.value)}
                      className={`${inputCls} w-[7.5rem] cursor-pointer`}>
                      {entry.week_key && liq.isClosed(entry.week_key) && (
                        <option value={entry.week_key} disabled>W{entry.week_key.slice(6)} (closed)</option>
                      )}
                      {liq.openWeeks.map((w) => (
                        <option key={w} value={w}>Week {w.slice(6).replace(/^0/, "")}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    {!closed && (
                      <button type="button" onClick={() => removeLiquidity(entry.id)}
                        className="rounded-lg bg-red-500 px-2.5 py-1 text-[0.7rem] font-semibold text-white transition hover:bg-red-600">Delete</button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>

          {!liq.isClosed(liqModal.week) && (
          <form onSubmit={submitLiquidityLine} className="mt-4 flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
            <input type="text" value={lSupplier} onChange={(e) => setLSupplier(e.target.value)} placeholder="Supplier / who" className={`${inputCls} min-w-[150px] flex-[2]`} />
            <input type="text" value={lDesc} onChange={(e) => setLDesc(e.target.value)} placeholder="Description (optional)" className={`${inputCls} min-w-[150px] flex-[2]`} />
            <input type="number" step="0.01" value={lAmount} onChange={(e) => setLAmount(e.target.value)} placeholder="Amount (e.g. -2000)" required className={`${inputCls} min-w-[120px] flex-1`} />
            <input type="text" maxLength={3} value={lCurrency} onChange={(e) => setLCurrency(e.target.value)} className={`${inputCls} w-16 uppercase`} />
            <input type="text" value={lComment} onChange={(e) => setLComment(e.target.value)} placeholder="Comment (e.g. To Pay on 30-Sep)" className={`${inputCls} min-w-[150px] flex-[2]`} />
            <button type="submit" disabled={saving} className="h-9 rounded-full bg-[#f4511e] px-4 text-[0.78rem] font-semibold text-white transition hover:bg-[#df4618] disabled:opacity-60">+ Add Line</button>
          </form>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Small building blocks ─────────────────────────────────────────────────────

function WeekGridRow({
  row,
  weeks,
  positive,
  onOpen,
}: {
  row: { key: string; label: string; values: number[]; total: number };
  weeks: string[];
  positive?: boolean;
  onOpen: (week: string) => void;
}) {
  const cellBg = (v: number) => (v === 0 ? "" : positive ? "bg-emerald-100" : "bg-red-200");
  return (
    <tr className="border-b border-black/[0.05]">
      <td className="whitespace-nowrap px-4 py-2 font-bold">{row.label}</td>
      {row.values.map((v, i) => (
        <td key={weeks[i]}
          className={`cursor-pointer px-3 py-2 text-right font-mono transition hover:brightness-95 ${cellBg(v)}`}
          onClick={() => onOpen(weeks[i])}>
          {fmt(v)}
        </td>
      ))}
      <td className={`px-4 py-2 text-right font-mono font-bold ${row.total === 0 ? "" : row.total >= 0 ? "bg-emerald-100" : "bg-red-200"}`}>{fmt(row.total)}</td>
      <td />
    </tr>
  );
}

function Modal({ title, wide, onClose, children }: { title: string; wide?: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
      <div role="presentation" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative flex max-h-[85vh] w-full flex-col rounded-xl bg-white shadow-xl ${wide ? "max-w-4xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <h2 className="text-[0.95rem] font-extrabold text-[#1a1a1a]">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5c5e62] transition hover:bg-[#f0f2f5]">
            <X size={15} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">{label}</label>
      {children}
    </div>
  );
}
